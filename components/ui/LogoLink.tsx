'use client';

import { useTheme } from 'next-themes';
import Link from 'next/link';
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

export default function LogoLink() {
  const { theme } = useTheme();

  return (
    <Link
      href="/"
      className="flex items-center gap-3 font-semibold"
      style={{ color: theme === "dark" ? "#ffffff" : "#06c" }}
    >
      <ArrowLeft size={24} color="#06c" />
      <Image
        src="/images/logo.webp"
        alt="Logo Municipalidad de Concepción Las Minas"
        height={150}
        width={150}
      />
      <span className="hidden md:inline-block">
        Municipalidad de <br />Concepción Las Minas
      </span>
    </Link>
  );
}
