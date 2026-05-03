package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.projetintegre.dto.request.CertificationItemRequest;
import tn.esprit.projetintegre.dto.response.CertificationItemResponse;
import tn.esprit.projetintegre.entities.Certification;
import tn.esprit.projetintegre.entities.CertificationItem;
import tn.esprit.projetintegre.mapper.SiteModuleMapper;
import tn.esprit.projetintegre.repositories.CertificationItemRepository;
import tn.esprit.projetintegre.repositories.CertificationRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CertificationItemService {

    private final CertificationItemRepository certificationItemRepository;
    private final CertificationRepository certificationRepository;
    private final SiteModuleMapper siteMapper;

    public List<CertificationItemResponse> getItemsByCertification(Long certificationId) {
        return siteMapper
                .toCertificationItemResponseList(certificationItemRepository.findByCertificationId(certificationId));
    }

    public CertificationItemResponse addItem(Long certificationId, CertificationItemRequest request) {
        Certification cert = certificationRepository.findById(certificationId)
                .orElseThrow(() -> new RuntimeException("Certification not found"));
        CertificationItem item = siteMapper.toEntity(request, cert);
        if (item == null)
            throw new RuntimeException("Invalid request");
        CertificationItem saved = certificationItemRepository.save(item);
        recalculateScore(cert);
        return siteMapper.toResponse(saved);
    }

    public CertificationItemResponse updateItem(Long itemId, CertificationItemRequest request) {
        CertificationItem existing = certificationItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        siteMapper.updateEntity(existing, request);
        CertificationItem saved = certificationItemRepository.save(existing);
        recalculateScore(existing.getCertification());
        return siteMapper.toResponse(saved);
    }

    public void deleteItem(Long itemId) {
        CertificationItem item = certificationItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        Certification cert = item.getCertification();
        certificationItemRepository.deleteById(itemId);
        recalculateScore(cert);
    }

    private void recalculateScore(Certification cert) {
        List<CertificationItem> items = certificationItemRepository
                .findByCertificationId(cert.getId());
        // Each item is 0-10, scale total to 0-100
        int total = items.stream().mapToInt(CertificationItem::getScore).sum();
        int maxPossible = items.size() * 10;
        int score = maxPossible > 0 ? (total * 100) / maxPossible : 0;
        cert.setScore(score);
        certificationRepository.save(cert);
    }
}
