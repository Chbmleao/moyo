/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	// pdfjs-dist v3 (CJS/UMD) — alias canvas to false (optional native dep)
	webpack: config => {
		config.resolve.alias.canvas = false;
		return config;
	},
};

export default nextConfig;
