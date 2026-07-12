export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas-dark px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-title-lg text-primary">AssetFlow</span>
        </div>
        {children}
      </div>
    </div>
  );
}
