package tn.esprit.projetintegre.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "forum_comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "article_id")
    private ForumArticle article;

    @ManyToOne
    @JoinColumn(name = "author_id")
    private User author;

    @Column(length = 2000)
    private String content;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private ForumComment parent;

    private Integer likeCount = 0;
    private Boolean isApproved = true;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
