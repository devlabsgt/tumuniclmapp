-- ========= TABLA 1: CATEGORÍAS (JERÁRQUICA) =========

CREATE TABLE public.categorias (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    nombre TEXT NOT NULL,
    codigo_propio TEXT NOT NULL,
    id_padre BIGINT REFERENCES public.categorias(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage all categories"
ON public.categorias
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

---

-- ========= TABLA 2: BIENES (SIMPLIFICADA) =========

CREATE TABLE public.bienes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    id_categoria BIGINT NOT NULL REFERENCES public.categorias(id),
    correlativo BIGINT NOT NULL,
    descripcion TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    url_imagen TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.bienes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage all assets"
ON public.bienes
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

---

-- ========= TABLA 3: MOVIMIENTOS (HISTORIAL) =========

CREATE TABLE public.movimientos_inventario (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    id_bien BIGINT NOT NULL REFERENCES public.bienes(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    fecha TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    id_usuario_origen UUID REFERENCES auth.users(id),
    id_usuario_destino UUID REFERENCES auth.users(id),
    notas TEXT,
    id_usuario_registro UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage all movements"
ON public.movimientos_inventario
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

---

-- ========= TABLA 4: TRANSACCIONES (CONTABILIDAD) =========

CREATE TABLE public.transacciones (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    id_bien BIGINT NOT NULL REFERENCES public.bienes(id),
    id_usuario_registro UUID NOT NULL REFERENCES auth.users(id),
    fecha_transaccion TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    monto NUMERIC(15, 2) NOT NULL,
    tipo TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage all transactions"
ON public.transacciones
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

---

-- ========= TABLA 5: CORRELATIVOS DE CATEGORÍA =========

CREATE TABLE public.correlativos_categoria (
    id_categoria BIGINT PRIMARY KEY REFERENCES public.categorias(id),
    ultimo_correlativo INT NOT NULL DEFAULT 0
);

---

-- ========= FUNCIÓN: ALTA DE BIEN =========

CREATE OR REPLACE FUNCTION alta_bien(
    id_categoria_param BIGINT,
    descripcion_param TEXT,
    monto_param NUMERIC(15, 2),
    id_usuario_registro_param UUID
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    nuevo_bien_id BIGINT;
    correlativo_bien_id BIGINT;
BEGIN
    UPDATE public.correlativos_categoria
    SET ultimo_correlativo = ultimo_correlativo + 1
    WHERE id_categoria = id_categoria_param
    RETURNING ultimo_correlativo INTO correlativo_bien_id;

    IF correlativo_bien_id IS NULL THEN
      INSERT INTO public.correlativos_categoria (id_categoria, ultimo_correlativo)
      VALUES (id_categoria_param, 1)
      RETURNING ultimo_correlativo INTO correlativo_bien_id;
    END IF;

    INSERT INTO public.bienes (id_categoria, correlativo, descripcion, user_id)
    VALUES (id_categoria_param, correlativo_bien_id, descripcion_param, id_usuario_registro_param)
    RETURNING id INTO nuevo_bien_id;

    INSERT INTO public.movimientos_inventario (id_bien, tipo, id_usuario_destino, id_usuario_registro)
    VALUES (nuevo_bien_id, 'Alta', id_usuario_registro_param, id_usuario_registro_param);

    INSERT INTO public.transacciones (id_bien, id_usuario_registro, monto, tipo, descripcion)
    VALUES (nuevo_bien_id, id_usuario_registro_param, monto_param, 'Alta', 'Alta de bien');

    RETURN nuevo_bien_id;
END;
$$;

---

-- ========= PERMISOS DE FUNCIÓN Y TABLA =========

ALTER TABLE public.correlativos_categoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow function to manage correlatives"
ON public.correlativos_categoria
FOR ALL
USING (true)
WITH CHECK (auth.role() = 'service_role');

GRANT EXECUTE ON FUNCTION public.alta_bien(bigint, text, numeric, uuid) TO authenticated;
GRANT ALL ON public.bienes TO authenticated;
GRANT ALL ON public.movimientos_inventario TO authenticated;
GRANT ALL ON public.transacciones TO authenticated;