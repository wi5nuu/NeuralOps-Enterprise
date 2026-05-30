const TagInput = ({ value, onChange, placeholder }) => {
  const tags = value
    ? value.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const input = e.target;
      const val = input.value.trim();
      if (val && !tags.includes(val)) {
        const next = [...tags, val].join(", ");
        onChange(next);
      }
      input.value = "";
    }
    if (e.key === "Backspace" && !e.target.value && tags.length > 0) {
      const next = tags.slice(0, -1).join(", ");
      onChange(next);
    }
  };

  const removeTag = (tag) => {
    const next = tags.filter((t) => t !== tag).join(", ");
    onChange(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 bg-[#0A0B0F] border border-[#1E2030] rounded-lg px-3 py-2 focus-within:border-[#6366F1] transition-colors">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 bg-[#6366F1]/20 text-[#6366F1] text-xs font-medium px-2.5 py-1 rounded-full"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="hover:text-white transition-colors leading-none"
          >
            &times;
          </button>
        </span>
      ))}
      <input
        type="text"
        className="flex-1 min-w-[100px] bg-transparent text-sm text-white outline-none placeholder-gray-500"
        placeholder={tags.length === 0 ? placeholder : ""}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default TagInput;
