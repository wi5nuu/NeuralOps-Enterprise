const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {Icon && (
        <div className="mb-4 text-gray-500">
          <Icon size={48} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-300 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 text-center max-w-md mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
