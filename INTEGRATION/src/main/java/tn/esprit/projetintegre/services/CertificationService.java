package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.dto.request.CertificationRequest;
import tn.esprit.projetintegre.dto.response.CertificationResponse;
import tn.esprit.projetintegre.dto.response.CertificationItemResponse;
import tn.esprit.projetintegre.entities.Certification;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.enums.CertificationStatus;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.CertificationRepository;
import tn.esprit.projetintegre.repositories.UserRepository;
import tn.esprit.projetintegre.repositories.SiteRepository;
import tn.esprit.projetintegre.entities.Site;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CertificationService {

    private final CertificationRepository certificationRepository;
    private final UserRepository userRepository;
    private final SiteRepository siteRepository;

    public List<CertificationResponse> getAll() {
        return certificationRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Page<CertificationResponse> getAllPaginated(Pageable pageable) {
        return certificationRepository.findAll(pageable).map(this::toResponse);
    }

    public CertificationResponse getById(Long id) {
        return toResponse(findById(id));
    }

    public List<CertificationResponse> getByUserId(Long userId) {
        return certificationRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<CertificationResponse> getBySiteId(Long siteId) {
        return certificationRepository.findBySiteId(siteId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public CertificationResponse create(CertificationRequest request) {
        Certification certification = new Certification();
        certification.setCertificationCode("CERT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        certification.setTitle(request.getTitle());
        certification.setDescription(request.getDescription());
        certification.setIssuingOrganization(request.getIssuingOrganization());
        certification.setIssueDate(request.getIssueDate());
        certification.setExpirationDate(request.getExpirationDate());
        certification.setDocumentUrl(request.getDocumentUrl());
        certification.setVerificationUrl(request.getVerificationUrl());
        certification.setScore(request.getScore());
        certification.setStatus(CertificationStatus.PENDING);
        
        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", request.getUserId()));
            certification.setUser(user);
        }

        if (request.getSiteId() != null) {
            Site site = siteRepository.findById(request.getSiteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Site", "id", request.getSiteId()));
            certification.setSite(site);
        }
        
        return toResponse(certificationRepository.save(certification));
    }

    public CertificationResponse update(Long id, CertificationRequest request) {
        Certification certification = findById(id);
        certification.setTitle(request.getTitle());
        certification.setDescription(request.getDescription());
        certification.setIssuingOrganization(request.getIssuingOrganization());
        certification.setIssueDate(request.getIssueDate());
        certification.setExpirationDate(request.getExpirationDate());
        certification.setDocumentUrl(request.getDocumentUrl());
        certification.setVerificationUrl(request.getVerificationUrl());
        certification.setScore(request.getScore());
        
        return toResponse(certificationRepository.save(certification));
    }

    public CertificationResponse updateStatus(Long id, CertificationStatus status) {
        Certification certification = findById(id);
        certification.setStatus(status);
        return toResponse(certificationRepository.save(certification));
    }

    public void delete(Long id) {
        if (!certificationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Certification", "id", id);
        }
        certificationRepository.deleteById(id);
    }

    private Certification findById(Long id) {
        return certificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certification", "id", id));
    }

    private CertificationResponse toResponse(Certification c) {
        return CertificationResponse.builder()
                .id(c.getId())
                .certificationCode(c.getCertificationCode())
                .title(c.getTitle())
                .description(c.getDescription())
                .issuingOrganization(c.getIssuingOrganization())
                .issueDate(c.getIssueDate())
                .expirationDate(c.getExpirationDate())
                .status(c.getStatus())
                .documentUrl(c.getDocumentUrl())
                .verificationUrl(c.getVerificationUrl())
                .score(c.getScore())
                .userId(c.getUser() != null ? c.getUser().getId() : null)
                .userName(c.getUser() != null ? c.getUser().getName() : null)
                .siteId(c.getSite() != null ? c.getSite().getId() : null)
                .items(c.getItems() != null ? c.getItems().stream()
                        .map(i -> CertificationItemResponse.builder()
                                .id(i.getId())
                                .name(i.getName())
                                .description(i.getDescription())
                                .score(i.getScore())
                                .requiredScore(i.getRequiredScore())
                                .passed(i.getPassed())
                                .completedAt(i.getCompletedAt())
                                .build())
                        .collect(Collectors.toList()) : null)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
