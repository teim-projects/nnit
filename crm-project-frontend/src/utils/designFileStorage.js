// IndexedDB Utility for Large CAD & Drawing File Storage (Overcomes 5MB localStorage quota)

const DB_NAME = "NNIT_DESIGN_FILES_DB";
const STORE_NAME = "files";
const DB_VERSION = 1;

/**
 * Open or initialize IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this browser"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error || new Error("Failed to open IndexedDB"));
    };
  });
}

/**
 * Store a single file (Blob, File object, or Data URL) in IndexedDB
 */
export async function storeFileInDB(key, fileOrData, metadata = {}) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const record = {
        key: key,
        data: fileOrData,
        name: metadata.name || "drawing_file",
        type: metadata.type || "autocad",
        size: metadata.size || "",
        timestamp: Date.now(),
      };

      const req = store.put(record);

      req.onsuccess = () => resolve(key);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("IndexedDB storeFile error:", err);
    throw err;
  }
}

/**
 * Retrieve a stored file from IndexedDB
 */
export async function getFileFromDB(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("IndexedDB getFile error:", err);
    return null;
  }
}

/**
 * Delete a stored file from IndexedDB
 */
export async function deleteFileFromDB(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("IndexedDB deleteFile error:", err);
    return false;
  }
}

/**
 * Trigger download of a file stored in IndexedDB, or from a remote URL / Data URL
 */
export async function triggerFileDownload(fileInfo, fallbackName = "download.dwg") {
  if (!fileInfo) return;

  const fileName = fileInfo.name || fallbackName;

  // Case 1: Stored in IndexedDB via key or fileKey
  const storageKey = fileInfo.fileKey || fileInfo.key || fileInfo.id;
  if (storageKey) {
    try {
      const record = await getFileFromDB(storageKey);
      if (record && record.data) {
        let blobUrl = "";
        let isBlobCreated = false;

        if (record.data instanceof Blob) {
          blobUrl = URL.createObjectURL(record.data);
          isBlobCreated = true;
        } else if (typeof record.data === "string" && record.data.startsWith("data:")) {
          // Convert base64 data url to Blob for safer large download
          const parts = record.data.split(",");
          const mime = parts[0].match(/:(.*?);/)?.[1] || "application/octet-stream";
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          blobUrl = URL.createObjectURL(blob);
          isBlobCreated = true;
        } else if (typeof record.data === "string") {
          blobUrl = record.data;
        }

        if (blobUrl) {
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = blobUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          if (isBlobCreated) {
            setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
          }
          return;
        }
      }
    } catch (e) {
      console.warn("IndexedDB download fallback:", e);
    }
  }

  // Case 2: URL available directly (HTTP or small Data URL)
  if (fileInfo.url) {
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = fileInfo.url;
    a.download = fileName;
    a.target = "_blank";
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Case 3: fileObject is directly present in memory
  if (fileInfo.fileObject && fileInfo.fileObject instanceof Blob) {
    const url = URL.createObjectURL(fileInfo.fileObject);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

/**
 * Strip bloated base64 data from a design request object before saving to localStorage
 * to ensure localStorage remains well under the 5MB browser quota.
 */
export function sanitizeRequestForLocalStorage(req) {
  if (!req || typeof req !== "object") return req;

  const clone = { ...req };

  // Remove or shrink large base64 strings
  if (typeof clone.drawingUrl === "string" && clone.drawingUrl.startsWith("data:") && clone.drawingUrl.length > 500) {
    clone.drawingUrl = "";
  }
  if (typeof clone.customerLayoutUrl === "string" && clone.customerLayoutUrl.startsWith("data:") && clone.customerLayoutUrl.length > 500) {
    clone.customerLayoutUrl = "";
  }

  // Clean drawingFiles
  if (Array.isArray(clone.drawingFiles)) {
    clone.drawingFiles = clone.drawingFiles.map((f) => ({
      key: f.key || f.fileKey || f.id || `file_${Math.random().toString(36).substring(2, 9)}`,
      name: f.name || "drawing.dwg",
      size: f.size || "",
      type: f.type || "autocad",
      url: typeof f.url === "string" && !f.url.startsWith("data:") ? f.url : "",
    }));
  }

  // Clean versions history
  if (Array.isArray(clone.versions)) {
    clone.versions = clone.versions.map((v) => {
      const vClone = { ...v };
      if (typeof vClone.customer_layout_url === "string" && vClone.customer_layout_url.startsWith("data:") && vClone.customer_layout_url.length > 500) {
        vClone.customer_layout_url = "";
      }
      if (Array.isArray(vClone.drawing_files)) {
        vClone.drawing_files = vClone.drawing_files.map((f) => ({
          key: f.key || f.fileKey || f.id || `file_${Math.random().toString(36).substring(2, 9)}`,
          name: f.name || "drawing.dwg",
          size: f.size || "",
          type: f.type || "autocad",
          url: typeof f.url === "string" && !f.url.startsWith("data:") ? f.url : "",
        }));
      }
      return vClone;
    });
  }

  return clone;
}

/**
 * Safely saves design requests to localStorage with automatic cleanup if quota exceeded
 */
export function safeSaveDesignRequests(requestsList) {
  if (!Array.isArray(requestsList)) return;

  // First pass: sanitize all items by removing large inline base64 blobs
  const cleanList = requestsList.map(sanitizeRequestForLocalStorage);

  try {
    localStorage.setItem("nnit_design_requests", JSON.stringify(cleanList));
  } catch (err) {
    console.warn("Storage quota exceeded on first attempt, running aggressive purge...", err);
    try {
      // Aggressive purge: clean existing localStorage keys that might be bloated
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes("cache") || key.includes("temp")) {
          localStorage.removeItem(key);
        }
      }

      // Keep only essential metadata in requests
      const minimalList = cleanList.map((item) => ({
        ...item,
        drawingUrl: "",
        customerLayoutUrl: "",
      }));

      localStorage.setItem("nnit_design_requests", JSON.stringify(minimalList));
    } catch (secondErr) {
      console.error("Critical: localStorage quota completely exhausted:", secondErr);
    }
  }
}

/**
 * Self-healing cleanup of bloated base64 strings in existing localStorage data
 * Runs automatically on page load to free up browser storage quota immediately.
 */
export function cleanupExistingLocalStorage() {
  try {
    const raw = localStorage.getItem("nnit_design_requests");
    if (!raw) return;
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return;

    let hasBloat = false;
    const cleaned = list.map((item) => {
      let isItemBloated = false;
      const clone = { ...item };
      if (typeof clone.drawingUrl === "string" && clone.drawingUrl.startsWith("data:") && clone.drawingUrl.length > 500) {
        clone.drawingUrl = "";
        isItemBloated = true;
      }
      if (typeof clone.customerLayoutUrl === "string" && clone.customerLayoutUrl.startsWith("data:") && clone.customerLayoutUrl.length > 500) {
        clone.customerLayoutUrl = "";
        isItemBloated = true;
      }
      if (Array.isArray(clone.drawingFiles)) {
        clone.drawingFiles = clone.drawingFiles.map((f) => {
          if (typeof f.url === "string" && f.url.startsWith("data:") && f.url.length > 500) {
            isItemBloated = true;
            return { ...f, url: "" };
          }
          return f;
        });
      }
      if (Array.isArray(clone.versions)) {
        clone.versions = clone.versions.map((v) => {
          const vClone = { ...v };
          if (typeof vClone.customer_layout_url === "string" && vClone.customer_layout_url.startsWith("data:") && vClone.customer_layout_url.length > 500) {
            vClone.customer_layout_url = "";
            isItemBloated = true;
          }
          if (Array.isArray(vClone.drawing_files)) {
            vClone.drawing_files = vClone.drawing_files.map((f) => {
              if (typeof f.url === "string" && f.url.startsWith("data:") && f.url.length > 500) {
                isItemBloated = true;
                return { ...f, url: "" };
              }
              return f;
            });
          }
          return vClone;
        });
      }
      if (isItemBloated) hasBloat = true;
      return clone;
    });

    if (hasBloat) {
      localStorage.setItem("nnit_design_requests", JSON.stringify(cleaned));
      console.log("Self-healed bloated base64 data from localStorage, freed up quota.");
    }
  } catch (e) {
    console.warn("Cleanup check warning:", e);
  }
}

// Automatically invoke on module load
if (typeof window !== "undefined") {
  cleanupExistingLocalStorage();
}

