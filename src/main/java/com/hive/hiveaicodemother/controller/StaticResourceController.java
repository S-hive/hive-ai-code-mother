package com.hive.hiveaicodemother.controller;

import com.hive.hiveaicodemother.constant.AppConstant;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.HandlerMapping;

import java.io.File;

/**
 * 静态资源访问
 * http://localhost:8123/api/static/{deployKey}[/{fileName}]
 */
@RestController
@RequestMapping("/static")
public class StaticResourceController {

    // 应用生成根目录（用于浏览）
    private static final String PREVIEW_ROOT_DIR = AppConstant.CODE_OUTPUT_ROOT_DIR;

    /**
     * 提供静态资源访问，支持目录重定向
     * 访问格式：http://localhost:8123/api/static/{deployKey}[/{fileName}]
     */
    @GetMapping("/{deployKey}/**")
    public ResponseEntity<Resource> serveStaticResource(
            @PathVariable String deployKey,
            HttpServletRequest request) {
        try {
            // 获取资源路径
            String resourcePath = (String) request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
            resourcePath = resourcePath.substring(("/static/" + deployKey).length());
            File appDir = new File(PREVIEW_ROOT_DIR, deployKey).getCanonicalFile();
            File file = new File(appDir, resourcePath).getCanonicalFile();
            // 防止通过 ../ 跳出当前应用目录
            if (!file.toPath().startsWith(appDir.toPath())) {
                return ResponseEntity.notFound().build();
            }
            // 目录访问（如 Vue 工程的 dist/）需要回退到该目录下的 index.html
            if (file.isDirectory()) {
                // 地址不以斜杠结尾时，页面内的相对路径会解析到上一级，必须先重定向
                if (!resourcePath.endsWith("/")) {
                    HttpHeaders headers = new HttpHeaders();
                    headers.add("Location", request.getRequestURI() + "/");
                    return new ResponseEntity<>(headers, HttpStatus.MOVED_PERMANENTLY);
                }
                file = new File(file, "index.html");
            }
            // 检查文件是否存在
            if (!file.isFile()) {
                return ResponseEntity.notFound().build();
            }
            // 返回文件资源
            Resource resource = new FileSystemResource(file);
            return ResponseEntity.ok()
                    .header("Content-Type", getContentTypeWithCharset(file.getName()))
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 根据文件扩展名返回带字符编码的 Content-Type
     */
    private String getContentTypeWithCharset(String filePath) {
        if (filePath.endsWith(".html")) return "text/html; charset=UTF-8";
        if (filePath.endsWith(".css")) return "text/css; charset=UTF-8";
        if (filePath.endsWith(".js") || filePath.endsWith(".mjs")) return "application/javascript; charset=UTF-8";
        if (filePath.endsWith(".json") || filePath.endsWith(".map")) return "application/json; charset=UTF-8";
        if (filePath.endsWith(".svg")) return "image/svg+xml; charset=UTF-8";
        if (filePath.endsWith(".png")) return "image/png";
        if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
        if (filePath.endsWith(".gif")) return "image/gif";
        if (filePath.endsWith(".webp")) return "image/webp";
        if (filePath.endsWith(".ico")) return "image/x-icon";
        if (filePath.endsWith(".woff2")) return "font/woff2";
        if (filePath.endsWith(".woff")) return "font/woff";
        if (filePath.endsWith(".ttf")) return "font/ttf";
        return "application/octet-stream";
    }
}
