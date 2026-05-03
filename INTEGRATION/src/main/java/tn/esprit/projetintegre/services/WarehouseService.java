package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.dto.request.WarehouseRequest;
import tn.esprit.projetintegre.dto.response.WarehouseResponse;
import tn.esprit.projetintegre.entities.Warehouse;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.exception.DuplicateResourceException;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.WarehouseRepository;
import tn.esprit.projetintegre.repositories.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;

    public List<WarehouseResponse> getAll() {
        return warehouseRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Page<WarehouseResponse> getAllPaginated(Pageable pageable) {
        return warehouseRepository.findAll(pageable).map(this::toResponse);
    }

    public List<WarehouseResponse> getActive() {
        return warehouseRepository.findByIsActive(true).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public WarehouseResponse getById(Long id) {
        return toResponse(findById(id));
    }

    public WarehouseResponse getByCode(String code) {
        return toResponse(warehouseRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Entrepôt", "code", code)));
    }

    public WarehouseResponse create(WarehouseRequest request) {
        if (warehouseRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException("Entrepôt", "code", request.getCode());
        }
        
        Warehouse warehouse = new Warehouse();
        warehouse.setCode(request.getCode());
        warehouse.setName(request.getName());
        warehouse.setDescription(request.getDescription());
        warehouse.setAddress(request.getAddress());
        warehouse.setCity(request.getCity());
        warehouse.setCountry(request.getCountry());
        warehouse.setPostalCode(request.getPostalCode());
        warehouse.setPhone(request.getPhone());
        warehouse.setEmail(request.getEmail());
        warehouse.setLatitude(request.getLatitude());
        warehouse.setLongitude(request.getLongitude());
        warehouse.setCapacity(request.getCapacity());
        warehouse.setIsPrimary(request.getIsPrimary() != null ? request.getIsPrimary() : false);
        warehouse.setIsActive(true);
        
        if (request.getManagerId() != null) {
            User manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", request.getManagerId()));
            warehouse.setManager(manager);
        }
        
        return toResponse(warehouseRepository.save(warehouse));
    }

    public WarehouseResponse update(Long id, WarehouseRequest request) {
        Warehouse warehouse = findById(id);
        
        if (!warehouse.getCode().equals(request.getCode()) && warehouseRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException("Entrepôt", "code", request.getCode());
        }
        
        warehouse.setCode(request.getCode());
        warehouse.setName(request.getName());
        warehouse.setDescription(request.getDescription());
        warehouse.setAddress(request.getAddress());
        warehouse.setCity(request.getCity());
        warehouse.setCountry(request.getCountry());
        warehouse.setPostalCode(request.getPostalCode());
        warehouse.setPhone(request.getPhone());
        warehouse.setEmail(request.getEmail());
        warehouse.setLatitude(request.getLatitude());
        warehouse.setLongitude(request.getLongitude());
        warehouse.setCapacity(request.getCapacity());
        
        if (request.getIsPrimary() != null) {
            warehouse.setIsPrimary(request.getIsPrimary());
        }
        
        if (request.getManagerId() != null) {
            User manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", request.getManagerId()));
            warehouse.setManager(manager);
        }
        
        return toResponse(warehouseRepository.save(warehouse));
    }

    public void delete(Long id) {
        Warehouse warehouse = findById(id);
        warehouse.setIsActive(false);
        warehouseRepository.save(warehouse);
    }

    private Warehouse findById(Long id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entrepôt", "id", id));
    }

    private WarehouseResponse toResponse(Warehouse w) {
        return WarehouseResponse.builder()
                .id(w.getId())
                .code(w.getCode())
                .name(w.getName())
                .description(w.getDescription())
                .address(w.getAddress())
                .city(w.getCity())
                .country(w.getCountry())
                .postalCode(w.getPostalCode())
                .phone(w.getPhone())
                .email(w.getEmail())
                .latitude(w.getLatitude())
                .longitude(w.getLongitude())
                .capacity(w.getCapacity())
                .currentUsage(w.getCurrentUsage())
                .isActive(w.getIsActive())
                .isPrimary(w.getIsPrimary())
                .managerId(w.getManager() != null ? w.getManager().getId() : null)
                .managerName(w.getManager() != null ? w.getManager().getName() : null)
                .createdAt(w.getCreatedAt())
                .updatedAt(w.getUpdatedAt())
                .build();
    }
}
