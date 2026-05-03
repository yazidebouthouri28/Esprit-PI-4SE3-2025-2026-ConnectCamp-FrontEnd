package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.entities.ForumArticle;
import tn.esprit.projetintegre.entities.ForumComment;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.ForumArticleRepository;
import tn.esprit.projetintegre.repositories.ForumCommentRepository;
import tn.esprit.projetintegre.repositories.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ForumService {

    private final ForumArticleRepository articleRepository;
    private final ForumCommentRepository commentRepository;
    private final UserRepository userRepository;

    // Article methods
    public Page<ForumArticle> getAllArticles(Pageable pageable) {
        return articleRepository.findAll(pageable);
    }

    public ForumArticle getArticleById(Long id) {
        return articleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found with id: " + id));
    }

    public Page<ForumArticle> getPublishedArticles(Pageable pageable) {
        return articleRepository.findByIsPublishedTrue(pageable);
    }

    public Page<ForumArticle> getArticlesByAuthorId(Long authorId, Pageable pageable) {
        return articleRepository.findByAuthorId(authorId, pageable);
    }

    public Page<ForumArticle> getArticlesByCategory(String category, Pageable pageable) {
        return articleRepository.findByCategory(category, pageable);
    }

    public List<ForumArticle> getPinnedArticles() {
        return articleRepository.findByIsPinnedTrue();
    }

    public Page<ForumArticle> searchArticles(String keyword, Pageable pageable) {
        return articleRepository.searchArticles(keyword, pageable);
    }

    public ForumArticle createArticle(ForumArticle article, Long authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + authorId));

        article.setAuthor(author);
        article.setViewCount(0);
        article.setLikeCount(0);
        return articleRepository.save(article);
    }

    public ForumArticle updateArticle(Long id, ForumArticle articleDetails) {
        ForumArticle article = getArticleById(id);
        article.setTitle(articleDetails.getTitle());
        article.setContent(articleDetails.getContent());
        article.setCategory(articleDetails.getCategory());
        article.setTags(articleDetails.getTags());
        article.setIsPublished(articleDetails.getIsPublished());
        article.setIsPinned(articleDetails.getIsPinned());
        return articleRepository.save(article);
    }

    public ForumArticle incrementViewCount(Long id) {
        ForumArticle article = getArticleById(id);
        article.setViewCount(article.getViewCount() + 1);
        return articleRepository.save(article);
    }

    public ForumArticle likeArticle(Long id) {
        ForumArticle article = getArticleById(id);
        article.setLikeCount(article.getLikeCount() + 1);
        return articleRepository.save(article);
    }

    public void deleteArticle(Long id) {
        ForumArticle article = getArticleById(id);
        articleRepository.delete(article);
    }

    // Comment methods
    public List<ForumComment> getCommentsByArticleId(Long articleId) {
        return commentRepository.findByArticleIdAndParentIsNull(articleId);
    }

    public ForumComment getCommentById(Long id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + id));
    }

    public ForumComment createComment(ForumComment comment, Long articleId, Long authorId, Long parentId) {
        ForumArticle article = getArticleById(articleId);
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + authorId));

        comment.setArticle(article);
        comment.setAuthor(author);
        comment.setLikeCount(0);
        comment.setIsApproved(true);

        if (parentId != null) {
            ForumComment parent = getCommentById(parentId);
            comment.setParent(parent);
        }

        return commentRepository.save(comment);
    }

    public ForumComment updateComment(Long id, ForumComment commentDetails) {
        ForumComment comment = getCommentById(id);
        comment.setContent(commentDetails.getContent());
        return commentRepository.save(comment);
    }

    public ForumComment likeComment(Long id) {
        ForumComment comment = getCommentById(id);
        comment.setLikeCount(comment.getLikeCount() + 1);
        return commentRepository.save(comment);
    }

    public void deleteComment(Long id) {
        ForumComment comment = getCommentById(id);
        commentRepository.delete(comment);
    }
}
