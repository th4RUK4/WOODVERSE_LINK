import "@testing-library/jest-dom";

const localStorageData = new Map();
const localStorageMock = {
  getItem(key) {
    return localStorageData.get(String(key)) ?? null;
  },
  setItem(key, value) {
    localStorageData.set(String(key), String(value));
  },
  removeItem(key) {
    localStorageData.delete(String(key));
  },
  clear() {
    localStorageData.clear();
  },
  key(index) {
    return Array.from(localStorageData.keys())[Number(index)] ?? null;
  },
  get length() {
    return localStorageData.size;
  },
};

globalThis.localStorage = localStorageMock;
if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", { configurable: true, value: localStorageMock });
}

vi.mock("../components/CroppedImage", () => ({
  CroppedImage: () => {
    const React = require("react");
    return React.createElement("div", { "data-testid": "cropped-image" }, "[Image]");
  },
}));
