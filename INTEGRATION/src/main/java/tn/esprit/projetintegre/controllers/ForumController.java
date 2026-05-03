package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.PageResponse;
import tn.esprit.projetintegre.entities.ForumArticle;
import tn.esprit.projetintegre.entities.ForumComment;
import tn.esprit.projetintegre.services.ForumService;

import java.util.List;

@RestController
@RequestMapping("/api/forum")
@RequiredArgsConstructor
@Tag(name = "Forum", description = "Forum management APIs")
public class ForumController {

    private final ForumService forumService;

    // Article endpoints
    @GetMapping("/articles")
    @Operation(summary = "Get all articles paginated")
    public ResponseEntity<ApiResponse<PageResponse<ForumArticle>>> getAllArticles(Pageable pageable) {
        Page<ForumArticle> page = forumService.getAllArticles(pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @GetMapping("/articles/{id}")
    @Operation(summary = "Get article by ID")
    public ResponseEntity<ApiResponse<ForumArticle>> getArticleById(@PathVariable Long id) {
        forumService.incrementViewCount(id);
        return ResponseEntity.ok(ApiResponse.success(forumService.getArticleById(id)));
    }

    @GetMapping("/articles/published")
    @Operation(summary = "Get published articles")
    public ResponseEntity<ApiResponse<PageResponse<ForumArticle>>> getPublishedArticles(Pageable pageable) {
        Page<ForumArticle> page = forumService.getPublishedArticles(pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @GetMapping("/articles/author/{authorId}")
    @Operation(summary = "Get articles by author ID")
    public ResponseEntity<ApiResponse<PageResponse<ForumArticle>>> getArticlesByAuthorId(@PathVariable Long authorId, Pageable pageable) {
        Page<ForumArticle> page = forumService.getArticlesByAuthorId(authorId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @GetMapping("/articles/category/{category}")
    @Operation(summary = "Get articles by category")
    public ResponseEntity<ApiResponse<PageResponse<ForumArticle>>> getArticlesByCategory(@PathVariable String category, Pageable pageable) {
        Page<ForumArticle> page = forumService.getArticlesByCategory(category, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @GetMapping("/articles/pinned")
    @Operation(summary = "Get pinned articles")
    public ResponseEntity<ApiResponse<List<ForumArticle>>> getPinnedArticles() {
        return ResponseEntity.ok(ApiResponse.success(forumService.getPinnedArticles()));
    }

    @GetMapping("/articles/search")
    @Operation(summary = "Search articles")
    public ResponseEntity<ApiResponse<PageResponse<ForumArticle>>> searchArticles(@RequestParam String keyword, Pageable pageable) {
        Page<ForumArticle> page = forumService.searchArticles(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @PostMapping("/articles")
    @Operation(summary = "Create a new article")
    public ResponseEntity<ApiResponse<ForumArticle>> createArticle(
            @RequestBody ForumArticle article,
            @RequestParam Long authorId) {
        return ResponseEntity.ok(ApiResponse.success("Article created successfully",
                forumService.createArticle(article, authorId)));
    }

    @PutMapping("/articles/{id}")
    @Operation(summary = "Update an article")
    public ResponseEntity<ApiResponse<ForumArticle>> updateArticle(
            @PathVariable Long id,
            @RequestBody ForumArticle articleDetails) {
        return ResponseEntity.ok(ApiResponse.success("Article updated successfully",
                forumService.updateArticle(id, articleDetails)));
    }

    @PostMapping("/articles/{id}/like")
    @Operation(summary = "Like an article")
    public ResponseEntity<ApiResponse<ForumArticle>> likeArticle(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Article liked",
                forumService.likeArticle(id)));
    }

    @DeleteMapping("/articles/{id}")
    @Operation(summary = "Delete an article")
    public ResponseEntity<ApiResponse<Void>> deleteArticle(@PathVariable Long id) {
        forumService.deleteArticle(id);
        return ResponseEntity.ok(ApiResponse.success("Article deleted successfully", null));
    }

    // Comment endpoints
    @GetMapping("/articles/{articleId}/comments")
    @Operation(summary = "Get comments by article ID")
    public ResponseEntity<ApiResponse<List<ForumComment>>> getCommentsByArticleId(@PathVariable Long articleId) {
        return ResponseEntity.ok(ApiResponse.success(forumService.getCommentsByArticleId(articleId)));
    }

    @GetMapping("/comments/{id}")
    @Operation(summary = "Get comment by ID")
    public ResponseEntity<ApiResponse<ForumComment>> getCommentById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(forumService.getCommentById(id)));
    }

    @PostMapping("/comments")
    @Operation(summary = "Create a new comment")
    public ResponseEntity<ApiResponse<ForumComment>> createComment(
            @RequestBody ForumComment comment,
            @RequestParam Long articleId,
            @RequestParam Long authorId,
            @RequestParam(required = false) Long parentId) {
        return ResponseEntity.ok(ApiResponse.success("Comment created successfully",
                forumService.createComment(comment, articleId, authorId, parentId)));
    }

    @PutMapping("/comments/{id}")
    @Operation(summary = "Update a comment")
    public ResponseEntity<ApiResponse<ForumComment>> updateComment(
            @PathVariable Long id,
            @RequestBody ForumComment commentDetails) {
        return ResponseEntity.ok(ApiResponse.success("Comment updated successfully",
                forumService.updateComment(id, commentDetails)));
    }

    @PostMapping("/comments/{id}/like")
    @Operation(summary = "Like a comment")
    public ResponseEntity<ApiResponse<ForumComment>> likeComment(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Comment liked",
                forumService.likeComment(id)));
    }

    @DeleteMapping("/comments/{id}")
    @Operation(summary = "Delete a comment")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long id) {
        forumService.deleteComment(id);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted successfully", null));
    }
}
