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
  Key
} from "lucide-react";

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

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
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
      alert("All credential fields are required!");
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
        alert("Admin & Vendor credentials updated successfully in database!");
        setIsCredModalOpen(false);
      } else {
        alert("Failed to update credentials.");
      }
    } catch (e) {
      console.error(e);
      alert("Error connecting to credential server.");
    } finally {
      setIsSavingCreds(false);
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
          alert("Image upload failed! Please try again.");
        }
      } catch (err) {
        console.error("Error during image upload/compression:", err);
        alert("Image upload failed! Please try again.");
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      alert("Please enter a product name!");
      return;
    }

    const targetSection = sectionTitle === "CUSTOM" ? customSection : sectionTitle;
    if (!targetSection.trim()) {
      alert("Please enter or select a section name!");
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
      alert("Failed to add product. Please try again.");
    }
    setIsLoading(false);
  };

  const handleDeleteProduct = async (secTitle: string, productId: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      setIsLoading(true);
      const success = await deleteProductAsync(selectedCategory, secTitle, productId);
      if (success) {
        await refreshData();
      } else {
        alert("Failed to delete product.");
      }
      setIsLoading(false);
    }
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
      alert("Catalog order and layout positions saved successfully!");
    } else {
      alert("Failed to save changes. Please try again.");
    }
    setIsLoading(false);
  };

  const handleDiscardChanges = () => {
    if (confirm("Are you sure you want to discard unsaved layout changes?")) {
      setSections(JSON.parse(JSON.stringify(originalSections)));
      setHasUnsavedChanges(false);
    }
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
                    <input
                      type="password"
                      value={devPass}
                      onChange={(e) => setDevPass(e.target.value)}
                      className="form-input"
                      required
                    />
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
                    <input
                      type="password"
                      value={superPass}
                      onChange={(e) => setSuperPass(e.target.value)}
                      className="form-input"
                      required
                    />
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
                    <input
                      type="password"
                      value={vendorPass}
                      onChange={(e) => setVendorPass(e.target.value)}
                      className="form-input"
                      required
                    />
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
    </div>
  );
}
