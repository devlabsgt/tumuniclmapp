"use client";

import { Box, Heading, Text, VStack } from "@chakra-ui/react";
//import { useRouter } from "next/navigation"; ---deshabilitado porque no hace nada
import Navbar from "@/components/ui/LogoLink";

const Dashboard = () => {

  return (
    <Box>
      {/* Navbar */}
      <Navbar />

      {/* Contenido principal */}
      <VStack spacing={6} align="center" p={6}>
        <Heading>Bienvenido al Dashboard</Heading>
        <Text>Selecciona una opción para empezar.</Text>
        
      </VStack>
    </Box>
  );
};

export default Dashboard;
