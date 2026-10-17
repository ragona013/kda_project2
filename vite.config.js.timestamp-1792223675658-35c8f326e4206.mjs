// vite.config.js
import { defineConfig } from "file:///sessions/rcw-01lbkgkfoeww9p1ndpjyhtf2/mnt/www/2%EC%B0%A8%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/kda_project2/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/rcw-01lbkgkfoeww9p1ndpjyhtf2/mnt/www/2%EC%B0%A8%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/kda_project2/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///sessions/rcw-01lbkgkfoeww9p1ndpjyhtf2/mnt/www/2%EC%B0%A8%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/kda_project2/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-192.png", "pwa-512.png"],
      manifest: {
        name: "\uB098\uB9CC\uC758 \uC8FC\uC2DD\uD3AB\uC744 \uD0A4\uC6C0",
        short_name: "\uC8FC\uC2DD\uD3AB",
        description: "\uB9E4\uC8FC \uC18C\uC218\uC810 \uC8FC\uC2DD\uC744 \uBAA8\uC73C\uBA74 \uD3AB\uC774 \uC790\uB77C\uB294 \uBAA8\uC758 \uC11C\uBE44\uC2A4",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/api/]
      }
    })
  ],
  server: {
    port: 5173,
    host: true,
    // 같은 와이파이의 휴대폰에서 접속 허용
    allowedHosts: true,
    // cloudflared 등 터널 주소 허용
    proxy: { "/api": "http://localhost:3001" }
  },
  build: { chunkSizeWarningLimit: 2e3 }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvcmN3LTAxbGJrZ2tmb2V3dzlwMW5kcGp5aHRmMi9tbnQvd3d3LzJcdUNDMjhcdUQ1MDRcdUI4NUNcdUM4MURcdUQyQjgva2RhX3Byb2plY3QyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvc2Vzc2lvbnMvcmN3LTAxbGJrZ2tmb2V3dzlwMW5kcGp5aHRmMi9tbnQvd3d3LzJcdUNDMjhcdUQ1MDRcdUI4NUNcdUM4MURcdUQyQjgva2RhX3Byb2plY3QyL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9zZXNzaW9ucy9yY3ctMDFsYmtna2ZvZXd3OXAxbmRwanlodGYyL21udC93d3cvMiVFQyVCMCVBOCVFRCU5NCU4NCVFQiVBMSU5QyVFQyVBMCU5RCVFRCU4QSVCOC9rZGFfcHJvamVjdDIvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSAndml0ZS1wbHVnaW4tcHdhJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgVml0ZVBXQSh7XG4gICAgICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcbiAgICAgIGluY2x1ZGVBc3NldHM6IFsncHdhLTE5Mi5wbmcnLCAncHdhLTUxMi5wbmcnXSxcbiAgICAgIG1hbmlmZXN0OiB7XG4gICAgICAgIG5hbWU6ICdcdUIwOThcdUI5Q0NcdUM3NTggXHVDOEZDXHVDMkREXHVEM0FCXHVDNzQ0IFx1RDBBNFx1QzZDMCcsXG4gICAgICAgIHNob3J0X25hbWU6ICdcdUM4RkNcdUMyRERcdUQzQUInLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1x1QjlFNFx1QzhGQyBcdUMxOENcdUMyMThcdUM4MTAgXHVDOEZDXHVDMkREXHVDNzQ0IFx1QkFBOFx1QzczQ1x1QkE3NCBcdUQzQUJcdUM3NzQgXHVDNzkwXHVCNzdDXHVCMjk0IFx1QkFBOFx1Qzc1OCBcdUMxMUNcdUJFNDRcdUMyQTQnLFxuICAgICAgICB0aGVtZV9jb2xvcjogJyNmZmZmZmYnLFxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnI2ZmZmZmZicsXG4gICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcbiAgICAgICAgb3JpZW50YXRpb246ICdwb3J0cmFpdCcsXG4gICAgICAgIHN0YXJ0X3VybDogJy8nLFxuICAgICAgICBpY29uczogW1xuICAgICAgICAgIHsgc3JjOiAnL3B3YS0xOTIucG5nJywgc2l6ZXM6ICcxOTJ4MTkyJywgdHlwZTogJ2ltYWdlL3BuZycgfSxcbiAgICAgICAgICB7IHNyYzogJy9wd2EtNTEyLnBuZycsIHNpemVzOiAnNTEyeDUxMicsIHR5cGU6ICdpbWFnZS9wbmcnLCBwdXJwb3NlOiAnYW55IG1hc2thYmxlJyB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIHdvcmtib3g6IHtcbiAgICAgICAgZ2xvYlBhdHRlcm5zOiBbJyoqLyoue2pzLGNzcyxodG1sLGljbyxzdmd9J10sXG4gICAgICAgIG1heGltdW1GaWxlU2l6ZVRvQ2FjaGVJbkJ5dGVzOiA0ICogMTAyNCAqIDEwMjQsXG4gICAgICAgIG5hdmlnYXRlRmFsbGJhY2tEZW55bGlzdDogWy9eXFwvYXBpL10sXG4gICAgICB9LFxuICAgIH0pLFxuICBdLFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIGhvc3Q6IHRydWUsICAgICAgICAgIC8vIFx1QUMxOVx1Qzc0MCBcdUM2NDBcdUM3NzRcdUQzMENcdUM3NzRcdUM3NTggXHVENzM0XHVCMzAwXHVEM0YwXHVDNUQwXHVDMTFDIFx1QzgxMVx1QzE4RCBcdUQ1QzhcdUM2QTlcbiAgICBhbGxvd2VkSG9zdHM6IHRydWUsICAvLyBjbG91ZGZsYXJlZCBcdUI0RjEgXHVEMTMwXHVCMTEwIFx1QzhGQ1x1QzE4QyBcdUQ1QzhcdUM2QTlcbiAgICBwcm94eTogeyAnL2FwaSc6ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnIH0sXG4gIH0sXG4gIGJ1aWxkOiB7IGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMjAwMCB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWdhLFNBQVMsb0JBQW9CO0FBQzdiLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFFeEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sUUFBUTtBQUFBLE1BQ04sY0FBYztBQUFBLE1BQ2QsZUFBZSxDQUFDLGVBQWUsYUFBYTtBQUFBLE1BQzVDLFVBQVU7QUFBQSxRQUNSLE1BQU07QUFBQSxRQUNOLFlBQVk7QUFBQSxRQUNaLGFBQWE7QUFBQSxRQUNiLGFBQWE7QUFBQSxRQUNiLGtCQUFrQjtBQUFBLFFBQ2xCLFNBQVM7QUFBQSxRQUNULGFBQWE7QUFBQSxRQUNiLFdBQVc7QUFBQSxRQUNYLE9BQU87QUFBQSxVQUNMLEVBQUUsS0FBSyxnQkFBZ0IsT0FBTyxXQUFXLE1BQU0sWUFBWTtBQUFBLFVBQzNELEVBQUUsS0FBSyxnQkFBZ0IsT0FBTyxXQUFXLE1BQU0sYUFBYSxTQUFTLGVBQWU7QUFBQSxRQUN0RjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNQLGNBQWMsQ0FBQyw0QkFBNEI7QUFBQSxRQUMzQywrQkFBK0IsSUFBSSxPQUFPO0FBQUEsUUFDMUMsMEJBQTBCLENBQUMsUUFBUTtBQUFBLE1BQ3JDO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBO0FBQUEsSUFDTixjQUFjO0FBQUE7QUFBQSxJQUNkLE9BQU8sRUFBRSxRQUFRLHdCQUF3QjtBQUFBLEVBQzNDO0FBQUEsRUFDQSxPQUFPLEVBQUUsdUJBQXVCLElBQUs7QUFDdkMsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
