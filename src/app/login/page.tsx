// Arquivo: src/app/login/page.tsx
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4">
        <div className="flex h-20 w-full items-end rounded-lg bg-blue-600 p-3">
          <div className="text-white text-2xl">Prospect CRM</div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
