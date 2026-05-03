package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.dto.request.ShippingAddressRequest;
import tn.esprit.projetintegre.dto.response.ShippingAddressResponse;
import tn.esprit.projetintegre.entities.ShippingAddress;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.ShippingAddressRepository;
import tn.esprit.projetintegre.repositories.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ShippingAddressService {

    private final ShippingAddressRepository addressRepository;
    private final UserRepository userRepository;

    public List<ShippingAddressResponse> getByUserId(Long userId) {
        return addressRepository.findByUserIdAndIsActive(userId, true).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ShippingAddressResponse getById(Long id) {
        return toResponse(findById(id));
    }

    public ShippingAddressResponse getDefaultByUserId(Long userId) {
        return toResponse(addressRepository.findByUserIdAndIsDefault(userId, true)
                .orElseThrow(() -> new ResourceNotFoundException("Adresse par défaut non trouvée pour l'utilisateur", "userId", userId)));
    }

    public ShippingAddressResponse create(ShippingAddressRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", request.getUserId()));
        
        // If this is set as default, unset other defaults
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            addressRepository.findByUserIdAndIsDefault(user.getId(), true)
                    .ifPresent(addr -> {
                        addr.setIsDefault(false);
                        addressRepository.save(addr);
                    });
        }
        
        ShippingAddress address = new ShippingAddress();
        address.setLabel(request.getLabel());
        address.setRecipientName(request.getRecipientName());
        address.setPhone(request.getPhone());
        address.setAddressLine1(request.getAddressLine1());
        address.setAddressLine2(request.getAddressLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPostalCode(request.getPostalCode());
        address.setCountry(request.getCountry());
        address.setLatitude(request.getLatitude());
        address.setLongitude(request.getLongitude());
        address.setDeliveryInstructions(request.getDeliveryInstructions());
        address.setIsDefault(request.getIsDefault() != null ? request.getIsDefault() : false);
        address.setIsActive(true);
        address.setUser(user);
        
        return toResponse(addressRepository.save(address));
    }

    public ShippingAddressResponse update(Long id, ShippingAddressRequest request) {
        ShippingAddress address = findById(id);
        
        if (Boolean.TRUE.equals(request.getIsDefault()) && !Boolean.TRUE.equals(address.getIsDefault())) {
            addressRepository.findByUserIdAndIsDefault(address.getUser().getId(), true)
                    .ifPresent(addr -> {
                        addr.setIsDefault(false);
                        addressRepository.save(addr);
                    });
        }
        
        address.setLabel(request.getLabel());
        address.setRecipientName(request.getRecipientName());
        address.setPhone(request.getPhone());
        address.setAddressLine1(request.getAddressLine1());
        address.setAddressLine2(request.getAddressLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPostalCode(request.getPostalCode());
        address.setCountry(request.getCountry());
        address.setLatitude(request.getLatitude());
        address.setLongitude(request.getLongitude());
        address.setDeliveryInstructions(request.getDeliveryInstructions());
        if (request.getIsDefault() != null) {
            address.setIsDefault(request.getIsDefault());
        }
        
        return toResponse(addressRepository.save(address));
    }

    public void delete(Long id) {
        ShippingAddress address = findById(id);
        address.setIsActive(false);
        addressRepository.save(address);
    }

    private ShippingAddress findById(Long id) {
        return addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Adresse de livraison", "id", id));
    }

    private ShippingAddressResponse toResponse(ShippingAddress a) {
        return ShippingAddressResponse.builder()
                .id(a.getId())
                .label(a.getLabel())
                .recipientName(a.getRecipientName())
                .phone(a.getPhone())
                .addressLine1(a.getAddressLine1())
                .addressLine2(a.getAddressLine2())
                .city(a.getCity())
                .state(a.getState())
                .postalCode(a.getPostalCode())
                .country(a.getCountry())
                .latitude(a.getLatitude())
                .longitude(a.getLongitude())
                .deliveryInstructions(a.getDeliveryInstructions())
                .isDefault(a.getIsDefault())
                .isActive(a.getIsActive())
                .userId(a.getUser().getId())
                .fullAddress(a.getFullAddress())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
