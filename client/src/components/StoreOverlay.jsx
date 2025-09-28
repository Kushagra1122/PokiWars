import React, { useState, useEffect } from "react";

const STORE_ITEMS = ["Buy", "Sell", "Quit"];

export default function StoreOverlay({ open, onClose, onSelect }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e) => {
      if (e.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev - 1 + STORE_ITEMS.length) % STORE_ITEMS.length);
      } else if (e.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % STORE_ITEMS.length);
      } else if (e.key === "Enter") {
        onSelect(STORE_ITEMS[selectedIndex]);
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, selectedIndex, onClose, onSelect]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0, left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 9999,
        pointerEvents: "none" // Phaser still receives clicks
      }}
    >
      <div
        style={{
          backgroundColor: "#222",
          padding: 40,
          borderRadius: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          pointerEvents: "auto"
        }}
      >
        {STORE_ITEMS.map((item, i) => (
          <div
            key={item}
            style={{
              color: "white",
              fontSize: 24,
              margin: "10px 0",
              fontFamily: "Arial",
            }}
          >
            {selectedIndex === i ? ">" : " "} {item}
          </div>
        ))}
      </div>
    </div>
  );
}
