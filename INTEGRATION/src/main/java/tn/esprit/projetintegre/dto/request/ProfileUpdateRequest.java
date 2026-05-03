package tn.esprit.projetintegre.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdateRequest {

    @Size(min = 2, max = 100)
    private String name;

    @Size(max = 120)
    private String email;

    @Size(max = 30)
    private String phone;

    @Size(max = 500)
    private String address;

    @Size(max = 80)
    private String country;

    private Integer age;

    @Size(max = 500)
    private String avatar;

    @Size(max = 1000)
    private String bio;

    @Size(max = 200)
    private String location;

    @Size(max = 300)
    private String website;
}
