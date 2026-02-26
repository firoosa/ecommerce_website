export default function LoadingSpinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-2',
    lg: 'w-16 h-16 border-4',
  }
  return (
    <div className="flex justify-center items-center p-8">
      <div
        className={`${sizes[size]} border-primary-200 border-t-primary-500 rounded-full animate-spin`}
      />
    </div>
  )
}
