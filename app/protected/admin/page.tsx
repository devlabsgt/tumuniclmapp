'use client';

export default function AdminDashboard() {
  return (
    <section className="w-full max-w-5xl mx-auto py-16 px-4 md:px-8">
      <h1 className="text-4xl font-bold text-center text-foreground mb-8">
        Bienvenido al Dashboard de Administrador
      </h1>
      <p className="text-center text-muted-foreground text-lg">
        Desde aquí podrá gestionar el sistema interno de la municipalidad.
      </p>
    </section>
  );
}
