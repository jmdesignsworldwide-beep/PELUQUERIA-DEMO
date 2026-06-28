/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Permite subir fotos de clientes (hasta ~3MB) vía Server Actions.
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
