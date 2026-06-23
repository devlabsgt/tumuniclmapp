import GestorInventario from "@/components/inventario/GestorInventario";

export default function DependenciaPage() {
    return (
        <div className="h-full w-full bg-white dark:bg-neutral-950">
            <GestorInventario tipoVista="dependencia" />
        </div>
    );
}
