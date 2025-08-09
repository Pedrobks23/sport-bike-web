import React from "react";

function fmtBRL(n) { return Number(n || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }

export default function ProductCard({ item, onEdit, onToggleVisible, onDelete }) {
  return (
    <div className="relative card overflow-hidden">
      {!item.visible && (
        <span className="absolute top-2 left-2 z-10 badge bg-amber-500/90 text-black">OCULTO</span>
      )}

      <div className={`aspect-video ${!item.visible ? "opacity-70 saturate-50" : ""} bg-neutral-100 dark:bg-neutral-800`}>
        {(item.imageUrlCard || item.imageUrl) ? (
          <img src={item.imageUrlCard || item.imageUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full grid place-items-center text-neutral-500 text-sm">Sem imagem</div>
        )}
      </div>

      <div className="p-4 grid gap-1">
        <div className="font-semibold">{item.title}</div>
        {item.description && <div className="text-sm text-neutral-500 line-clamp-2">{item.description}</div>}
        <div className="text-sm font-medium">{fmtBRL(item.price)}</div>

        <div className="flex gap-2 pt-2">
          <button className="btn btn-outline" onClick={() => onEdit(item)}>Editar</button>
          <button className="btn btn-outline" onClick={() => onToggleVisible(item)}>{item.visible ? "Ocultar" : "Exibir"}</button>
          <button className="btn btn-danger" onClick={() => onDelete(item)}>Remover</button>
        </div>

        <div className="text-[11px] text-neutral-400">
          {item.publicId ? `Cloudinary ID: ${item.publicId}` : "Sem publicId"}
        </div>
      </div>
    </div>
  );
}
