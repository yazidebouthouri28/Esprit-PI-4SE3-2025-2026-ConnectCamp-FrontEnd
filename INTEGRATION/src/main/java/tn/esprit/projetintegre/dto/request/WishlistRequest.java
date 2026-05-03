package tn.esprit.projetintegre.dto.request;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistRequest {
    private String name;
    private Boolean isPublic;
}
