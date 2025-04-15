
export default function Header() {
  return (
    <div className="flex flex-col gap-16 items-center">

    <p className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-3xl text-center">
        Bienvenido a la Aplicación Web{" "}de la<br/>
        <a
          href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
          target="_blank"
          className="font-bold hover:underline"
          rel="noreferrer"
        >
          Municipalidad de Concepción Las minas
        </a>
      </p>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
