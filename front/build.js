import esbuild from "esbuild";
import stylePlugin from "esbuild-style-plugin";

const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--dev");

esbuild.build({
    entryPoints: [
        "src/index.ts"
    ],
    outdir: "dist",
    format: "esm",
    target: "es2022",
    bundle: true,
    sourcemap: true,
    external: [],
    splitting: false,
    minify: !isDev,
    plugins: [
        stylePlugin({
            renderOptions: {
                sassOptions: {
                    silenceDeprecations: ['legacy-js-api'],
                    outputStyle: "compressed"
                }
            }
        })
    ],
    external: ['/favicon.svg']
}).catch(() => process.exit(1));