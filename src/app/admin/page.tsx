"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  fetchCatalogAsync,
  addProductAsync,
  deleteProductAsync,
  saveLayoutAsync,
  uploadImageAsync,
  SectionProducts,
} from "@/lib/productStore";
import { KIOSK_CATEGORIES } from "@/components/Sidebar";
import { ProductCard } from "@/components/ProductCard";
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Lock,
  LogOut,
  ShieldCheck,
  Loader2,
  X,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Save,
  Undo2,
  Move,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Camera,
  UserCheck,
  History,
  AlertCircle,
  CircleUserRound,
  Key,
  Printer
} from "lucide-react";
import { CustomDialog } from "@/components/CustomDialog";

const CATEGORY_DEFAULT_SECTIONS: Record<number, string[]> = {
  1: ["CUPS & CONES", "KULFI", "BARS & CANDIES", "TUBS & PACKS"], // Ice Cream
  2: ["MILK", "DAHI", "PANEER", "BUTTER", "GHEE", "LASSI & CHAAS", "SHRIKHAND"], // Dairy
  3: ["BREAD", "COOKIES & TOAST", "CAKES & PASTRIES", "BUNS"], // Bakery
  4: ["SEV & BHUJIYA", "MIXTURE", "GATHIYA", "CHIPS & SNACKS"], // Namkeen
};

/**
 * Helper to compress and resize images client-side before upload to reduce database payload size
 */
const compressImage = (file: File, maxWidth = 350, maxHeight = 350, quality = 0.7): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Keep PNG and WebP as image/png to preserve transparent backgrounds
        const outputMimeType = file.type === "image/png" || file.type === "image/webp" ? "image/png" : "image/jpeg";

        // If converting to JPEG, fill the background with white instead of letting it default to black
        if (outputMimeType === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: outputMimeType, lastModified: Date.now() }));
            } else {
              resolve(file);
            }
          },
          outputMimeType,
          outputMimeType === "image/jpeg" ? quality : undefined
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default function AdminPage() {
  const router = useRouter();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Catalog State
  const [selectedCategory, setSelectedCategory] = useState<number>(2);
  const [sections, setSections] = useState<SectionProducts[]>([]);
  const [originalSections, setOriginalSections] = useState<SectionProducts[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Drag & Drop State
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);
  const [draggedProductInfo, setDraggedProductInfo] = useState<{
    sectionTitle: string;
    index: number;
  } | null>(null);

  // Modal & Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [sectionTitle, setSectionTitle] = useState<string>("MILK");
  const [customSection, setCustomSection] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [imageSrc, setImageSrc] = useState<string>("/products/milk/Milk_Aahar.png");
  const [showImage, setShowImage] = useState<boolean>(true);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  // Credentials Management State
  const [isCredModalOpen, setIsCredModalOpen] = useState<boolean>(false);
  const [devUser, setDevUser] = useState<string>("");
  const [devPass, setDevPass] = useState<string>("");
  const [superUser, setSuperUser] = useState<string>("");
  const [superPass, setSuperPass] = useState<string>("");
  const [vendorUser, setVendorUser] = useState<string>("");
  const [vendorPass, setVendorPass] = useState<string>("");
  const [isSavingCreds, setIsSavingCreds] = useState<boolean>(false);
  const [showDevPass, setShowDevPass] = useState<boolean>(false);
  const [showSuperPass, setShowSuperPass] = useState<boolean>(false);
  const [showVendorPass, setShowVendorPass] = useState<boolean>(false);

  // Receipt Settings State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [receiptShowLogo, setReceiptShowLogo] = useState<boolean>(true);
  const [receiptShowUser, setReceiptShowUser] = useState<boolean>(true);
  const [receiptShowTimestamp, setReceiptShowTimestamp] = useState<boolean>(true);
  const [isSavingReceipt, setIsSavingReceipt] = useState<boolean>(false);
  const [receiptPreviewType, setReceiptPreviewType] = useState<"canteen" | "gate">("canteen");

  // Custom dialog alert/confirm state
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: "info" | "success" | "error" | "confirm";
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: ""
  });

  const showAlert = (message: string, type: "info" | "success" | "error" = "info", title?: string) => {
    const defaultTitles = {
      info: "Information",
      success: "Success",
      error: "Error"
    };
    setDialogState({
      isOpen: true,
      type,
      title: title || defaultTitles[type],
      message
    });
  };

  const showConfirm = (message: string, onConfirm: () => void, title = "Confirm Action") => {
    setDialogState({
      isOpen: true,
      type: "confirm",
      title,
      message,
      onConfirm
    });
  };

  // Authenticate user check
  useEffect(() => {
    const role = sessionStorage.getItem("dinshaws_admin_role");
    if (role === "dev") {
      setIsAuthenticated(true);
    } else {
      router.replace("/login?redirect=/admin");
    }
  }, [router]);

  // Load current credentials from DB
  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/auth/credentials")
        .then((res) => res.json())
        .then((data) => {
          if (data.dev) {
            setDevUser(data.dev.username);
            setDevPass(data.dev.password);
          }
          if (data.super) {
            setSuperUser(data.super.username);
            setSuperPass(data.super.password);
          }
          if (data.vendor) {
            setVendorUser(data.vendor.username);
            setVendorPass(data.vendor.password);
          }
        })
        .catch((err) => console.error("Error loading credentials:", err));
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    sessionStorage.removeItem("dinshaws_admin_role");
    router.replace("/login");
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devUser.trim() || !devPass || !superUser.trim() || !superPass || !vendorUser.trim() || !vendorPass) {
      showAlert("All credential fields are required!", "error");
      return;
    }

    setIsSavingCreds(true);
    try {
      const response = await fetch("/api/auth/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dev: { username: devUser, password: devPass },
          super: { username: superUser, password: superPass },
          vendor: { username: vendorUser, password: vendorPass }
        }),
      });

      if (response.ok) {
        showAlert("Admin & Vendor credentials updated successfully in database!", "success");
        setIsCredModalOpen(false);
      } else {
        showAlert("Failed to update credentials.", "error");
      }
    } catch (e) {
      console.error(e);
      showAlert("Error connecting to credential server.", "error");
    } finally {
      setIsSavingCreds(false);
    }
  };

  // Load receipt settings from DB
  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/receipt-settings")
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setReceiptShowLogo(data.showLogo);
            setReceiptShowUser(data.showUser);
            setReceiptShowTimestamp(data.showTimestamp);
          }
        })
        .catch((err) => console.error("Error loading receipt settings:", err));
    }
  }, [isAuthenticated]);

  const handleSaveReceiptSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingReceipt(true);
    try {
      const response = await fetch("/api/receipt-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headerText: "",
          subHeaderText: "",
          kioskName: "",
          phone: "",
          footerText: "",
          showLogo: receiptShowLogo,
          showUser: receiptShowUser,
          showTimestamp: receiptShowTimestamp
        }),
      });

      if (response.ok) {
        showAlert("Receipt print settings updated successfully!", "success");
        setIsReceiptModalOpen(false);
      } else {
        showAlert("Failed to update receipt settings.", "error");
      }
    } catch (e) {
      console.error(e);
      showAlert("Error connecting to settings server.", "error");
    } finally {
      setIsSavingReceipt(false);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    const catalog = await fetchCatalogAsync();
    const currentSections = catalog[selectedCategory] || [];
    setSections(currentSections);
    setOriginalSections(JSON.parse(JSON.stringify(currentSections)));
    setHasUnsavedChanges(false);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated, selectedCategory]);

  // Dynamically reset sectionTitle when selectedCategory changes to avoid mismatching/cross-category sections
  useEffect(() => {
    const defaultSecs = CATEGORY_DEFAULT_SECTIONS[selectedCategory] || [];
    const existingTitles = sections.map((s) => s.sectionTitle.toUpperCase().trim());
    const merged = Array.from(new Set([...defaultSecs, ...existingTitles]));
    if (merged.length > 0) {
      const currentTitleUpper = sectionTitle.toUpperCase().trim();
      if (!merged.includes(currentTitleUpper) && sectionTitle !== "CUSTOM") {
        setSectionTitle(merged[0]);
      }
    } else {
      setSectionTitle("CUSTOM");
    }
  }, [selectedCategory, sections, sectionTitle]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingImage(true);
      try {
        const compressed = await compressImage(file);
        const uploadedUrl = await uploadImageAsync(compressed);
        if (uploadedUrl) {
          setImageSrc(uploadedUrl);
          setShowImage(true);
        } else {
          showAlert("Image upload failed! Please try again.", "error");
        }
      } catch (err) {
        console.error("Error during image upload/compression:", err);
        showAlert("Image upload failed! Please try again.", "error");
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      showAlert("Please enter a product name!", "error");
      return;
    }

    const targetSection = sectionTitle === "CUSTOM" ? customSection : sectionTitle;
    if (!targetSection.trim()) {
      showAlert("Please enter or select a section name!", "error");
      return;
    }

    setIsLoading(true);
    const finalImageSrc = showImage ? imageSrc : "";
    const success = await addProductAsync(selectedCategory, targetSection, {
      name: productName,
      imageSrc: finalImageSrc,
    });

    if (success) {
      setProductName("");
      setImageSrc("/products/milk/Milk_Aahar.png");
      setShowImage(true);
      setIsAddModalOpen(false);
      await refreshData();
    } else {
      showAlert("Failed to add product. Please try again.", "error");
    }
    setIsLoading(false);
  };

  const handleDeleteProduct = async (secTitle: string, productId: string, name: string) => {
    showConfirm(
      `Are you sure you want to delete "${name}"?`,
      async () => {
        setIsLoading(true);
        const success = await deleteProductAsync(selectedCategory, secTitle, productId);
        if (success) {
          await refreshData();
        } else {
          showAlert("Failed to delete product.", "error");
        }
        setIsLoading(false);
      }
    );
  };

  // Drag and Drop Handlers for Sections
  const handleSectionDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", `section:${index}`);
    setDraggedSectionIndex(index);
  };

  const handleSectionDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSectionIndex === null || draggedSectionIndex === targetIndex) return;

    const newSections = [...sections];
    const [movedSection] = newSections.splice(draggedSectionIndex, 1);
    newSections.splice(targetIndex, 0, movedSection);

    setSections(newSections);
    setHasUnsavedChanges(true);
    setDraggedSectionIndex(null);
  };

  // Drag and Drop Handlers for Products
  const handleProductDragStart = (e: React.DragEvent, sectionTitle: string, index: number) => {
    e.stopPropagation();
    e.dataTransfer.setData("text/plain", `product:${sectionTitle}:${index}`);
    setDraggedProductInfo({ sectionTitle, index });
  };

  const handleProductDrop = (e: React.DragEvent, targetSectionTitle: string, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedProductInfo) return;

    const { sectionTitle: sourceSectionTitle, index: sourceIndex } = draggedProductInfo;

    // Handle swap/move inside the same section
    if (sourceSectionTitle === targetSectionTitle) {
      if (sourceIndex === targetIndex) return;

      const targetSection = sections.find((s) => s.sectionTitle === targetSectionTitle);
      if (!targetSection) return;

      const newProducts = [...targetSection.products];
      const [movedProduct] = newProducts.splice(sourceIndex, 1);
      newProducts.splice(targetIndex, 0, movedProduct);

      const newSections = sections.map((s) => {
        if (s.sectionTitle === targetSectionTitle) {
          return { ...s, products: newProducts };
        }
        return s;
      });

      setSections(newSections);
      setHasUnsavedChanges(true);
    } else {
      // Handle move across sections
      const sourceSection = sections.find((s) => s.sectionTitle === sourceSectionTitle);
      const targetSection = sections.find((s) => s.sectionTitle === targetSectionTitle);
      if (!sourceSection || !targetSection) return;

      const sourceProducts = [...sourceSection.products];
      const targetProducts = [...targetSection.products];

      const [movedProduct] = sourceProducts.splice(sourceIndex, 1);
      targetProducts.splice(targetIndex, 0, movedProduct);

      const newSections = sections.map((s) => {
        if (s.sectionTitle === sourceSectionTitle) {
          return { ...s, products: sourceProducts };
        }
        if (s.sectionTitle === targetSectionTitle) {
          return { ...s, products: targetProducts };
        }
        return s;
      });

      setSections(newSections);
      setHasUnsavedChanges(true);
    }

    setDraggedProductInfo(null);
  };

  // Local reordering handler for sections (using Up/Down arrows)
  const handleMoveSectionLocal = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    setSections(newSections);
    setHasUnsavedChanges(true);
  };

  // Local reordering handler for products (using Left/Right arrows on cards)
  const handleMoveProductLocal = (sectionTitle: string, index: number, direction: "left" | "right") => {
    const targetSection = sections.find((s) => s.sectionTitle === sectionTitle);
    if (!targetSection) return;

    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= targetSection.products.length) return;

    const newProducts = [...targetSection.products];
    const temp = newProducts[index];
    newProducts[index] = newProducts[targetIndex];
    newProducts[targetIndex] = temp;

    const newSections = sections.map((s) => {
      if (s.sectionTitle === sectionTitle) {
        return { ...s, products: newProducts };
      }
      return s;
    });

    setSections(newSections);
    setHasUnsavedChanges(true);
  };

  // Save changes to backend database
  const handleSaveLayout = async () => {
    setIsLoading(true);
    const success = await saveLayoutAsync(selectedCategory, sections);
    if (success) {
      setOriginalSections(JSON.parse(JSON.stringify(sections)));
      setHasUnsavedChanges(false);
      showAlert("Catalog order and layout positions saved successfully!", "success");
    } else {
      showAlert("Failed to save changes. Please try again.", "error");
    }
    setIsLoading(false);
  };

  const handleDiscardChanges = () => {
    showConfirm(
      "Are you sure you want to discard unsaved layout changes?",
      () => {
        setSections(JSON.parse(JSON.stringify(originalSections)));
        setHasUnsavedChanges(false);
      }
    );
  };

  // Render Developer Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="admin-login-screen">
        <div className="admin-login-card" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
          <div style={{ color: "#ffffff", fontWeight: "600" }}>Redirecting to Login...</div>
        </div>
      </div>
    );
  }

  // Render Developer Admin Portal once authenticated
  return (
    <div className="admin-container">
      {/* Admin Top Header Bar */}
      <header className="admin-header">
        <div className="admin-header-left">
          <div className="admin-header-title-box">
            <h1 className="admin-title">DEV ADMIN PORTAL</h1>
            <span className="admin-badge">Dinshaw&apos;s Interactive Kiosk Editor</span>
          </div>
        </div>

        <div className="admin-header-actions">
          {/* Unsaved Changes Save/Discard Actions */}
          {hasUnsavedChanges && (
            <div className="unsaved-changes-actions animate-pulse-border">
              <button onClick={handleDiscardChanges} className="discard-layout-btn" disabled={isLoading}>
                <Undo2 className="w-4 h-4" />
                <span>Discard</span>
              </button>
              <button onClick={handleSaveLayout} className="save-layout-btn" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>SAVE CHANGES</span>
              </button>
            </div>
          )}

          {/* Manage Credentials Button */}
          <button onClick={() => setIsCredModalOpen(true)} className="admin-add-modal-btn" style={{ background: "#1f2937", borderColor: "#374151" }}>
            <Key className="w-4 h-4 text-gray-300" />
            <span>MANAGE CREDENTIALS</span>
          </button>

          {/* Receipt Settings Button */}
          <button onClick={() => setIsReceiptModalOpen(true)} className="admin-add-modal-btn" style={{ background: "#059669", borderColor: "#047857" }}>
            <Printer className="w-4 h-4 text-emerald-100" />
            <span>RECEIPT SETTINGS</span>
          </button>

          {/* Add Product Button */}
          <button onClick={() => setIsAddModalOpen(true)} className="admin-add-modal-btn">
            <Plus className="w-5 h-5" />
            <span>ADD NEW PRODUCT</span>
          </button>

          <button 
            onClick={handleLogout} 
            className="admin-logout-btn-icon"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Kiosk Layout Editor */}
      <div className="admin-content-grid single-column">
        <div className="admin-card list-card full-width-card visual-kiosk-card">
          <div className="admin-section-heading-row">
            <div className="heading-left-box">
              <h2 className="admin-section-heading">INTERACTIVE KIOSK EDITOR</h2>
              <span className="heading-hint">Use ▲ ▼ controls next to section names to reorder sections. Use ◀ ▶ arrow controls inside cards to reorder products.</span>
            </div>

            {/* Category Filter Selector */}
            <div className="header-category-picker">
              <span className="picker-label">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(Number(e.target.value))}
                className="form-select category-inline-select"
              >
                {KIOSK_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Drag & Move Help Banner */}
          <div className="drag-info-banner">
            <Info className="w-5 h-5 text-primary" />
            <span>Arrange layout using the position buttons on sections and products, then click <strong>SAVE CHANGES</strong> in the top right header.</span>
          </div>

          <div className="sections-list-scroll kiosk-view-canvas">
            {isLoading && sections.length === 0 ? (
              <div className="admin-empty">Loading catalog layout...</div>
            ) : sections.length > 0 ? (
              sections.map((sec, secIdx) => (
                <div key={sec.sectionTitle} className="editor-section-card">
                  {/* Section Title Header with Up/Down Arrow Reordering */}
                  <div className="editor-section-header">
                    <div className="editor-section-title-left">
                      <h3>{sec.sectionTitle}</h3>
                      <span className="count-pill">{sec.products.length} Items</span>
                    </div>

                    <div className="reorder-controls">
                      <span className="reorder-label">Section Position:</span>
                      <button
                        type="button"
                        onClick={() => handleMoveSectionLocal(secIdx, "up")}
                        disabled={secIdx === 0 || isLoading}
                        className="reorder-btn"
                        title="Move Section Up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSectionLocal(secIdx, "down")}
                        disabled={secIdx === sections.length - 1 || isLoading}
                        className="reorder-btn"
                        title="Move Section Down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Kiosk-Style Product Cards Grid */}
                  <div className="editor-products-grid">
                    {sec.products.map((prod, prodIdx) => (
                      <div
                        key={prod.id}
                        draggable
                        onDragStart={(e) => handleProductDragStart(e, sec.sectionTitle, prodIdx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleProductDrop(e, sec.sectionTitle, prodIdx)}
                        className={`editor-product-card-wrapper ${
                          draggedProductInfo?.sectionTitle === sec.sectionTitle &&
                          draggedProductInfo?.index === prodIdx
                            ? "dragging-item"
                            : ""
                        }`}
                      >
                        {/* Native Kiosk Product Card */}
                        <ProductCard product={prod} initialQuantity={0} />

                        {/* Hover Overlay Actions: Left Arrow, Trash, Right Arrow */}
                        <div className="editor-card-overlay-actions">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveProductLocal(sec.sectionTitle, prodIdx, "left");
                            }}
                            disabled={prodIdx === 0 || isLoading}
                            className="editor-card-arrow-btn"
                            title="Move Product Left"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(sec.sectionTitle, prod.id, prod.name);
                            }}
                            className="editor-card-delete-btn-overlay"
                            title="Delete Product"
                            disabled={isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveProductLocal(sec.sectionTitle, prodIdx, "right");
                            }}
                            disabled={prodIdx === sec.products.length - 1 || isLoading}
                            className="editor-card-arrow-btn"
                            title="Move Product Right"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {sec.products.length === 0 && (
                      <div
                        className="section-empty-drag-target"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleProductDrop(e, sec.sectionTitle, 0)}
                      >
                        <span>No products in this section. Drag cards here or add new products.</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="admin-empty">No products added for this category yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* POP-UP LANDSCAPE MODAL WITH LIVE PRODUCT CARD PREVIEW */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-container landscape-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-box">
                <h2 className="modal-title">ADD NEW PRODUCT</h2>
                <p className="modal-subtitle">Add a new item to Dinshaw&apos;s product catalog</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="modal-close-btn">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="modal-grid-split">
              {/* Form Input Wrapper (Scrollable) */}
              <div className="modal-form-scroll-wrapper">
                <form onSubmit={handleAddProduct} className="modal-form-inner">
                  {/* Category & Section Heading side by side */}
                  <div className="form-row-two-col">
                    <div className="form-group">
                      <label className="form-label">Target Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(Number(e.target.value))}
                        className="form-select"
                      >
                        {KIOSK_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Section Heading</label>
                      <select
                        value={sectionTitle}
                        onChange={(e) => setSectionTitle(e.target.value)}
                        className="form-select"
                      >
                        {(() => {
                          const defaultSecs = CATEGORY_DEFAULT_SECTIONS[selectedCategory] || [];
                          const existingTitles = sections.map((s) => s.sectionTitle.toUpperCase().trim());
                          const merged = Array.from(new Set([...defaultSecs, ...existingTitles]));
                          return (
                            <>
                              {merged.map((sec) => (
                                <option key={sec} value={sec}>
                                  {sec}
                                </option>
                              ))}
                              <option value="CUSTOM">+ Add New Section...</option>
                            </>
                          );
                        })()}
                      </select>
                    </div>
                  </div>

                  {sectionTitle === "CUSTOM" && (
                    <div className="form-group">
                      <label className="form-label">New Section Title</label>
                      <input
                        type="text"
                        placeholder="e.g. GHEE"
                        value={customSection}
                        onChange={(e) => setCustomSection(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>
                  )}

                  {/* Product Name */}
                  <div className="form-group">
                    <label className="form-label">Product Name & Variant</label>
                    <input
                      type="text"
                      placeholder="e.g. Fresh Paneer 500g, Amrik Milk 1 L"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  {/* Product Image Option & Upload */}
                  <div className="form-group">
                    <div className="image-toggle-row">
                      <label className="form-label">Product Image</label>
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !showImage;
                          setShowImage(nextState);
                          if (!nextState) {
                            setImageSrc("");
                          } else if (!imageSrc) {
                            setImageSrc("/products/milk/Milk_Aahar.png");
                          }
                        }}
                        className="image-checkbox-btn"
                      >
                        {showImage && imageSrc ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 text-muted" />
                        )}
                        <span>{showImage && imageSrc ? "Image Enabled" : "No Image"}</span>
                      </button>
                    </div>

                    <div className="image-upload-box">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        id="modal-product-image-file"
                        className="file-input-hidden"
                        disabled={uploadingImage}
                      />
                      <label htmlFor="modal-product-image-file" className="file-upload-label">
                        {uploadingImage ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Uploading Image...</span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-5 h-5" />
                            <span>Upload Custom Product Image</span>
                          </>
                        )}
                      </label>
                    </div>

                    {/* Selected Image Status & Clear Action */}
                    {imageSrc && showImage ? (
                      <div className="selected-preview-bar">
                        <span className="preset-label">Active Image:</span>
                        <div className="preview-thumb-box">
                          <Image
                            src={imageSrc}
                            alt="Preview"
                            width={48}
                            height={48}
                            className="preset-photo"
                            unoptimized={imageSrc.startsWith("data:")}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setImageSrc("");
                            setShowImage(false);
                          }}
                          className="clear-image-btn"
                          title="Remove Image"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Remove Image</span>
                        </button>
                      </div>
                    ) : (
                      <div className="no-image-selected-alert">
                        <span>No image active. Preview will render pure text fallback.</span>
                      </div>
                    )}

                    {/* Preset Picker */}
                    <div className="preset-images-picker">
                      <span className="preset-label">Or select preset icon:</span>
                      <div className="preset-grid">
                        {[
                          "/products/milk/Milk_Aahar.png",
                          "/products/milk/Milk_Phoorti.png",
                          "/products/milk/Milk_Sarvottam.png",
                          "/products/milk/Milk_Amrik.png",
                          "/products/dahi/Dahi_Dahi.png",
                          "/products/dahi/Dahi_Mishti_Dahi.png",
                          "/products/dahi/Dahi_Kadhi_Dahi.png",
                          "/products/paneer/Paneer_Fresh_Paneer.png",
                          "/products/paneer/Paneer_Frozen_Paneer.png",
                          "/products/butter/Butter.png",
                        ].map((path) => (
                          <button
                            type="button"
                            key={path}
                            className={`preset-thumb ${imageSrc === path && showImage ? "selected" : ""}`}
                            onClick={() => {
                              setImageSrc(path);
                              setShowImage(true);
                            }}
                          >
                            <Image src={path} alt="preset" width={40} height={40} className="preset-photo" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar inside Form Footer */}
                  <div className="modal-actions-bar">
                    <button
                      type="submit"
                      className="admin-submit-btn modal-submit-btn full-width-submit"
                      disabled={isLoading || uploadingImage}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          <span>ADD PRODUCT</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Live Kiosk Product Card Preview */}
              <div className="modal-preview-column">
                <div className="preview-card-header">
                  <Eye className="w-4 h-4 text-primary" />
                  <span>ACTUAL KIOSK CARD PREVIEW</span>
                </div>

                <div className="kiosk-preview-stage">
                  <ProductCard
                    product={{
                      id: "preview-card",
                      name: productName.trim() || "Product Name Preview",
                      imageSrc: showImage ? imageSrc : "",
                    }}
                    initialQuantity={0}
                  />
                </div>

                <p className="preview-stage-hint">
                  This card displays live in real-time. This is exactly how customers will see and interact with this item on the kiosk screen.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREDENTIALS SETTINGS MODAL */}
      {isCredModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCredModalOpen(false)}>
          <div className="modal-container landscape-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "980px" }}>
            <div className="modal-header">
              <div className="modal-title-box">
                <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Key className="w-5 h-5 text-primary" />
                  <span>MANAGE ADMIN & VENDOR CREDENTIALS</span>
                </h2>
                <p className="modal-subtitle">Update usernames and passwords stored securely in the database</p>
              </div>
              <button onClick={() => setIsCredModalOpen(false)} className="modal-close-btn">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCredentials}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", padding: "20px" }}>
                {/* Developer Role Section */}
                <div style={{ background: "rgba(222, 37, 30, 0.02)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(222, 37, 30, 0.05)" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: "700", color: "var(--primary)", marginBottom: "12px" }}>
                    DEVELOPER PORTAL
                  </h3>
                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label className="form-label">Dev Username</label>
                    <input
                      type="text"
                      value={devUser}
                      onChange={(e) => setDevUser(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dev Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showDevPass ? "text" : "password"}
                        value={devPass}
                        onChange={(e) => setDevPass(e.target.value)}
                        className="form-input"
                        style={{ paddingRight: "44px" }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowDevPass(!showDevPass)}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          padding: 0
                        }}
                      >
                        {showDevPass ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Super Admin Role Section */}
                <div style={{ background: "rgba(31, 41, 55, 0.02)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(31, 41, 55, 0.05)" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#1f2937", marginBottom: "12px" }}>
                    KIOSK SUPER ADMIN
                  </h3>
                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label className="form-label">Super Username</label>
                    <input
                      type="text"
                      value={superUser}
                      onChange={(e) => setSuperUser(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Super Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showSuperPass ? "text" : "password"}
                        value={superPass}
                        onChange={(e) => setSuperPass(e.target.value)}
                        className="form-input"
                        style={{ paddingRight: "44px" }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSuperPass(!showSuperPass)}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          padding: 0
                        }}
                      >
                        {showSuperPass ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Vendor Role Section */}
                <div style={{ background: "rgba(5, 150, 105, 0.02)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(5, 150, 105, 0.05)" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#059669", marginBottom: "12px" }}>
                    VENDOR PORTAL
                  </h3>
                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label className="form-label">Vendor Username</label>
                    <input
                      type="text"
                      value={vendorUser}
                      onChange={(e) => setVendorUser(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vendor Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showVendorPass ? "text" : "password"}
                        value={vendorPass}
                        onChange={(e) => setVendorPass(e.target.value)}
                        className="form-input"
                        style={{ paddingRight: "44px" }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowVendorPass(!showVendorPass)}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          padding: 0
                        }}
                      >
                        {showVendorPass ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions-bar" style={{ padding: "16px 20px" }}>
                <button
                  type="submit"
                  className="admin-submit-btn modal-submit-btn full-width-submit"
                  disabled={isSavingCreds}
                >
                  {isSavingCreds ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>SAVE NEW CREDENTIALS</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT PRINT SETTINGS MODAL */}
      {isReceiptModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsReceiptModalOpen(false)}>
          <div className="modal-container landscape-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "980px" }}>
            <div className="modal-header">
              <div className="modal-title-box">
                <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Printer className="w-5 h-5 text-primary" />
                  <span>RECEIPT PRINT & PREVIEW SETTINGS</span>
                </h2>
                <p className="modal-subtitle">Customize thermal receipt header, footer, logo, and metadata options</p>
              </div>
              <button onClick={() => setIsReceiptModalOpen(false)} className="modal-close-btn">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="modal-grid-split">
              {/* Left Column: Form Settings */}
              <div className="modal-form-scroll-wrapper" style={{ paddingRight: "16px" }}>
                <form onSubmit={handleSaveReceiptSettings} className="modal-form-inner" style={{ gap: "16px" }}>

                  {/* Toggle checkboxes */}
                  <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                    <label className="form-label" style={{ marginBottom: "2px" }}>Metadata Toggles</label>
                    
                    {/* Show Logo */}
                    <button
                      type="button"
                      onClick={() => setReceiptShowLogo(!receiptShowLogo)}
                      className="image-checkbox-btn"
                      style={{ justifyContent: "flex-start", width: "100%" }}
                    >
                      {receiptShowLogo ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-muted" />
                      )}
                      <span>Display Dinshaw&apos;s Logo Header</span>
                    </button>

                    {/* Show Employee */}
                    <button
                      type="button"
                      onClick={() => setReceiptShowUser(!receiptShowUser)}
                      className="image-checkbox-btn"
                      style={{ justifyContent: "flex-start", width: "100%" }}
                    >
                      {receiptShowUser ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-muted" />
                      )}
                      <span>Display Employee ID and Name</span>
                    </button>

                    {/* Show Timestamp */}
                    <button
                      type="button"
                      onClick={() => setReceiptShowTimestamp(!receiptShowTimestamp)}
                      className="image-checkbox-btn"
                      style={{ justifyContent: "flex-start", width: "100%" }}
                    >
                      {receiptShowTimestamp ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-muted" />
                      )}
                      <span>Display Date & Timestamp</span>
                    </button>
                  </div>

                  {/* Submit buttons */}
                  <div className="modal-actions-bar" style={{ padding: "10px 0 0 0", borderTop: "none" }}>
                    <button
                      type="submit"
                      className="admin-submit-btn modal-submit-btn full-width-submit"
                      disabled={isSavingReceipt}
                      style={{ background: "#059669" }}
                    >
                      {isSavingReceipt ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>SAVE RECEIPT SETTINGS</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Thermal Paper Receipt Live Preview */}
              <div className="modal-preview-column" style={{ background: "#f8f9fa", borderLeft: "1px solid var(--border-color)", padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: "16px" }}>
                <div className="preview-card-header" style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Eye className="w-4 h-4 text-primary" />
                    <span>LIVE RECEIPT PREVIEWS</span>
                  </div>
                </div>

                {/* Receipt Copy Select Tabs */}
                <div style={{ display: "flex", gap: "8px", width: "100%", background: "#f1f5f9", padding: "4px", borderRadius: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setReceiptPreviewType("canteen")}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: "700",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      background: receiptPreviewType === "canteen" ? "#ffffff" : "transparent",
                      color: receiptPreviewType === "canteen" ? "var(--primary)" : "#64748b",
                      boxShadow: receiptPreviewType === "canteen" ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
                      transition: "all 0.2s"
                    }}
                  >
                    CANTEEN COPY
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptPreviewType("gate")}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: "700",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      background: receiptPreviewType === "gate" ? "#ffffff" : "transparent",
                      color: receiptPreviewType === "gate" ? "var(--primary)" : "#64748b",
                      boxShadow: receiptPreviewType === "gate" ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
                      transition: "all 0.2s"
                    }}
                  >
                    GATE EXIT COPY
                  </button>
                </div>

                {/* Monospace Paper Container */}
                <div
                  style={{
                    background: "#ffffff",
                    width: "280px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                    borderTop: "3px dashed #d1d5db",
                    borderBottom: "3px dashed #d1d5db",
                    padding: "16px",
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: "12px",
                    color: "#1f2937",
                    lineHeight: "1.4",
                    boxSizing: "border-box"
                  }}
                >
                  {receiptShowLogo && (
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
                      <div style={{ background: "#de251e", padding: "4px 8px", borderRadius: "4px", display: "inline-block" }}>
                        <strong style={{ color: "#ffffff", fontSize: "11px", letterSpacing: "1px" }}>DINSHAW'S</strong>
                      </div>
                    </div>
                  )}

                  <div style={{ textAlign: "center", fontWeight: "bold", textTransform: "uppercase", fontSize: "13px" }}>
                    {receiptPreviewType === "canteen" ? "*** CANTEEN COPY ***" : "*** GATE COPY ***"}
                  </div>

                  <div style={{ borderBottom: "1px double #9ca3af", margin: "6px 0" }}></div>

                  {receiptShowTimestamp && (
                    <div><b>Date:</b> {new Date().toLocaleDateString("en-IN")} {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                  )}
                  <div><b>Order ID:</b> ORDER-MOCK-45217</div>
                  
                  {receiptShowUser && (
                    <div><b>Employee:</b> Shashank (emp-999)</div>
                  )}

                  <div style={{ borderBottom: "1px dashed #d1d5db", margin: "6px 0" }}></div>

                  <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px dashed #d1d5db" }}>
                        <th style={{ textAlign: "left", paddingBottom: "4px" }}>Item Description</th>
                        <th style={{ textAlign: "right", width: "40px", paddingBottom: "4px" }}>Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: "4px 0" }}>Fresh Paneer 500g</td>
                        <td style={{ textAlign: "right" }}>2</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "4px 0" }}>Mishti Dahi 100g</td>
                        <td style={{ textAlign: "right" }}>3</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ borderBottom: "1px dashed #d1d5db", margin: "6px 0" }}></div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "12px" }}>
                    <span>TOTAL ITEMS</span>
                    <span>5 units</span>
                  </div>

                  <div style={{ borderBottom: "1px double #9ca3af", margin: "6px 0" }}></div>
                </div>

                <p style={{ fontSize: "11px", color: "#6b7280", textAlign: "center", maxWidth: "280px" }}>
                  This shows exactly how the receipt layouts dynamically render during customer checkout operations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <CustomDialog
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
        onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
