package tn.esprit.projetintegre.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class SiteImageStorageService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public List<String> storeSiteImages(Long siteId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }

        Path baseDir = Paths.get(uploadDir, "sites", String.valueOf(siteId)).toAbsolutePath().normalize();
        try {
            Files.createDirectories(baseDir);
        } catch (IOException e) {
            throw new RuntimeException("Unable to create upload directory", e);
        }

        String baseUrl = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
        List<String> urls = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;
            String contentType = file.getContentType();
            if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
                continue;
            }

            String originalName = file.getOriginalFilename();
            String ext = StringUtils.getFilenameExtension(originalName);
            if (ext == null || ext.isBlank()) {
                ext = contentType.substring("image/".length());
            }
            ext = ext.replaceAll("[^a-zA-Z0-9]", "").toLowerCase(Locale.ROOT);
            if (ext.isBlank()) {
                ext = "jpg";
            }

            String filename = UUID.randomUUID() + "." + ext;
            Path destination = baseDir.resolve(filename).normalize();
            if (!destination.startsWith(baseDir)) {
                throw new RuntimeException("Invalid upload path");
            }

            try {
                Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new RuntimeException("Unable to store file", e);
            }

            String publicPath = "/uploads/sites/" + siteId + "/" + filename;
            urls.add(baseUrl + publicPath);
        }

        return urls;
    }

    public String storeHighlightMedia(Long siteId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Media file is required");
        }

        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank()
                || "application/octet-stream".equalsIgnoreCase(contentType.trim())) {
            contentType = inferContentTypeFromFilename(file.getOriginalFilename());
        }
        if (contentType == null || contentType.isBlank()) {
            throw new IllegalArgumentException("Invalid media type");
        }

        String normalizedContentType = contentType.toLowerCase(Locale.ROOT);
        boolean isImage = normalizedContentType.startsWith("image/");
        boolean isVideo = normalizedContentType.startsWith("video/");
        if (!isImage && !isVideo) {
            throw new IllegalArgumentException("Only image and video files are allowed");
        }

        Path baseDir = Paths.get(uploadDir, "camp-highlights", String.valueOf(siteId)).toAbsolutePath().normalize();
        try {
            Files.createDirectories(baseDir);
        } catch (IOException e) {
            throw new RuntimeException("Unable to create upload directory", e);
        }

        String originalName = file.getOriginalFilename();
        String ext = StringUtils.getFilenameExtension(originalName);
        if (ext == null || ext.isBlank()) {
            ext = normalizedContentType.substring(normalizedContentType.indexOf('/') + 1);
        }
        ext = ext.replaceAll("[^a-zA-Z0-9]", "").toLowerCase(Locale.ROOT);
        if (ext.isBlank()) {
            ext = isVideo ? "mp4" : "jpg";
        }

        String filename = UUID.randomUUID() + "." + ext;
        Path destination = baseDir.resolve(filename).normalize();
        if (!destination.startsWith(baseDir)) {
            throw new RuntimeException("Invalid upload path");
        }

        try {
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Unable to store file", e);
        }

        String baseUrl = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
        String publicPath = "/uploads/camp-highlights/" + siteId + "/" + filename;
        return baseUrl + publicPath;
    }

    /**
     * Browsers often omit or misreport {@code Content-Type} for multipart parts; infer from extension.
     */
    private String inferContentTypeFromFilename(String originalName) {
        if (originalName == null || originalName.isBlank()) {
            return null;
        }
        String lower = originalName.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".gif")) {
            return "image/gif";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        if (lower.endsWith(".bmp")) {
            return "image/bmp";
        }
        if (lower.endsWith(".svg")) {
            return "image/svg+xml";
        }
        if (lower.endsWith(".mp4")) {
            return "video/mp4";
        }
        if (lower.endsWith(".webm")) {
            return "video/webm";
        }
        if (lower.endsWith(".mov")) {
            return "video/quicktime";
        }
        if (lower.endsWith(".mkv")) {
            return "video/x-matroska";
        }
        return null;
    }

    public boolean deleteByPublicUrl(String url) {
        if (url == null || url.isBlank()) return false;

        String pathPart;
        try {
            URI uri = URI.create(url);
            pathPart = uri.getPath();
        } catch (IllegalArgumentException ex) {
            pathPart = url;
        }

        if (pathPart == null) return false;
        if (!pathPart.startsWith("/uploads/")) return false;

        String relative = pathPart.substring("/uploads/".length());
        Path uploadsBase = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path filePath = uploadsBase.resolve(relative).normalize();
        if (!filePath.startsWith(uploadsBase)) return false;

        try {
            return Files.deleteIfExists(filePath);
        } catch (IOException e) {
            return false;
        }
    }
}

