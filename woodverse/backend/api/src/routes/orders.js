import { Router } from "express";
import { databaseConfigured, query, getPool } from "../db.js";
import { buildFulfillmentPlan } from "../utils/helpers.js";
import { catalogProducts, orders } from "../data/memory.js";
import { currentTime, DELIVERY_FEE, ASSURANCE_FEE, parseOrderItems } from "../utils/helpers.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

export const ordersRouter = Router();
ordersRouter.post("/api/orders/evaluate-stock", authenticateToken, authorizeRoles("customer"), (req,res) => {
 const plan=buildFulfillmentPlan(req.body.items||[],catalogProducts);
 res.json({requiresVendorApproval:plan.some(i=>i.vendorApprovalRequired),productionTrackingRequired:plan.some(i=>i.decision==="manufacture"),fulfillmentPlan:plan});
});
ordersRouter.post("/api/orders",authenticateToken,authorizeRoles("customer"),async(req,res)=>{
 if(!databaseConfigured)return res.status(503).json({error:"PostgreSQL is not configured, so orders cannot be placed."});
 const parsed=parseOrderItems(req.body?.items);if(parsed.error)return res.status(400).json({error:parsed.error});
 const items=parsed.items;if(!items.length)return res.status(400).json({error:"Cart is empty."});
 const address=req.body?.shippingAddress;
 if(!address || !["fullName","phone","street","district"].every(k=>typeof address[k]==="string"&&address[k].trim())) return res.status(400).json({error:"Complete shipping address is required."});
 let client;
 try{
  await query("SELECT 1");client=await getPool().connect();await client.query("BEGIN");
  const pr=await client.query(`SELECT p.id,p.name,p.price,p.stock_quantity,p.vendor_id,v.business_name AS vendor FROM products p JOIN vendors v ON v.id=p.vendor_id WHERE p.id=ANY($1::uuid[]) AND p.status='published' FOR UPDATE OF p`,[items.map(i=>i.id)]);
  const map=new Map(pr.rows.map(r=>[String(r.id),r]));
  if(items.some(i=>!map.has(i.id))){await client.query("ROLLBACK");return res.status(400).json({error:"One or more products are unavailable. Refresh the catalog."});}
  const vendorIds=new Set(items.map(i=>String(map.get(i.id).vendor_id)));
  if(vendorIds.size!==1){await client.query("ROLLBACK");return res.status(400).json({error:"Please place orders for one vendor at a time."});}
  let subtotal=0;const plan=[];
  for(const item of items){
   const p=map.get(item.id),unitPrice=Number(p.price),lineTotal=Math.round(unitPrice*item.quantity*100)/100;subtotal+=lineTotal;
   const available=Number(p.stock_quantity),manufactureRequired=available<item.quantity;
   if(!manufactureRequired){const reserve=await client.query("UPDATE products SET stock_quantity=stock_quantity-$1,updated_at=NOW() WHERE id=$2 AND stock_quantity >= $1 RETURNING id",[item.quantity,p.id]);if(!reserve.rows.length){await client.query("ROLLBACK");return res.status(409).json({error:"Stock changed during checkout. Please review your cart."});}}
   plan.push({id:String(p.id),name:p.name,vendor:p.vendor,quantity:item.quantity,unitPrice,lineTotal,available,stock:available>0?(available<=4?`Low Stock (${available})`:"In Stock"):"Out of Stock",decision:manufactureRequired?"manufacture":"stock",vendorApprovalRequired:manufactureRequired,nextStep:manufactureRequired?"Vendor must approve before production tracking starts.":"Stock reserved and delivery preparation can begin.",reason:manufactureRequired?`Only ${available} in stock, ${item.quantity} requested.`:"Requested quantity was reserved."});
  }
  const delivery=DELIVERY_FEE,assurance=ASSURANCE_FEE,total=Math.round((subtotal+delivery+assurance)*100)/100,requiresManufacturing=plan.some(i=>i.vendorApprovalRequired);
  const created=(await client.query(`INSERT INTO orders(customer_id,vendor_id,status,total_amount,requires_manufacturing,fulfillment_plan,shipping_address) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[req.user.id,[...vendorIds][0],requiresManufacturing?"vendor_approval":"processing",total,requiresManufacturing,JSON.stringify(plan),JSON.stringify(req.body.shippingAddress||{})])).rows[0];
  await client.query("COMMIT");
  orders.unshift({id:created.id,customer:req.user.fullName,status:requiresManufacturing?"Vendor Approval":"Processing",requiresVendorApproval:requiresManufacturing,createdAt:created.created_at});
  if(req.io){const vu=(await query("SELECT user_id FROM vendors WHERE id=$1",[created.vendor_id])).rows[0]?.user_id;const rooms=new Set(["woodverse-notifications",`customer:${created.customer_id}:notifications`]);if(vu)rooms.add(`vendor:${vu}:notifications`);for(const room of rooms)req.io.to(room).emit("notification:event",{id:`notice-${Date.now()}`,audience:"Vendor",source:"WoodVerse API",title:requiresManufacturing?"Order needs vendor approval":"New stock order",message:requiresManufacturing?`Order ${created.id} needs approval before production.`:`Order ${created.id} has reserved stock.`,time:currentTime()});}
  return res.status(201).json({order:created,requiresVendorApproval:requiresManufacturing,productionTrackingRequired:requiresManufacturing,fulfillmentPlan:plan,pricing:{subtotal,delivery,assurance,total}});
 }catch{if(client)await client.query("ROLLBACK").catch(()=>{});return res.status(500).json({error:"Unable to place order. Please try again."});}finally{client?.release();}
});
ordersRouter.get("/api/orders",authenticateToken,authorizeRoles("admin","vendor","customer"),async(req,res)=>{
 if(!databaseConfigured){
  // Fail closed for memory mode: never return the shared in-memory order list
  // to every authenticated role.
  if(req.user.role==="admin") return res.json({orders});
  if(req.user.role==="customer") return res.json({orders:orders.filter(o=>String(o.customerId||o.customer_id||"")===String(req.user.id))});
  if(req.user.role==="vendor") return res.json({orders:orders.filter(o=>String(o.vendorUserId||o.vendor_user_id||"")===String(req.user.id))});
  return res.json({orders:[]});
 }
 const sql=`SELECT o.*,u.full_name AS customer_name,v.business_name AS vendor_name FROM orders o LEFT JOIN users u ON u.id=o.customer_id LEFT JOIN vendors v ON v.id=o.vendor_id`;
 try{let result;if(req.user.role==="customer")result=await query(`${sql} WHERE o.customer_id=$1 ORDER BY o.created_at DESC`,[req.user.id]);else if(req.user.role==="vendor"){const v=(await query("SELECT id FROM vendors WHERE user_id=$1",[req.user.id])).rows[0]?.id;if(!v)return res.json({orders:[]});result=await query(`${sql} WHERE o.vendor_id=$1 ORDER BY o.created_at DESC`,[v]);}else result=await query(`${sql} ORDER BY o.created_at DESC`);return res.json({orders:result.rows});}catch{return res.status(500).json({error:"Unable to retrieve orders."});}
});
