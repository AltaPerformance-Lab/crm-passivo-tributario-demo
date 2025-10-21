// Arquivo: src/components/LogoutButton.tsx
import { PowerIcon } from "@heroicons/react/24/outline";
// Usamos o atalho '@/app/...' que o Next.js configura para caminhos a partir de 'src'
import { handleSignOut } from "@/app/lib/actions";

export default function LogoutButton() {
  return (
    <form action={handleSignOut}>
      <button className="flex h-[48px] w-full items-center justify-center gap-2 rounded-md bg-gray-800 p-3 text-sm font-medium text-white hover:bg-gray-700 md:flex-none md:justify-start md:p-2 md:px-3">
        <PowerIcon className="w-6" />
        <div className="hidden md:block">Sair</div>
      </button>
    </form>
  );
}

//Botão de logout simples que aciona a função handleSignOut ao ser clicado.
//Importa o ícone PowerIcon da biblioteca Heroicons para exibir um ícone de energia no botão.
//Usa estilos Tailwind CSS para estilizar o botão, garantindo que ele seja responsivo e tenha uma boa aparência em diferentes tamanhos de tela.
