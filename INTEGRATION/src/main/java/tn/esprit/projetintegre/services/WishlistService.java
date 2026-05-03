package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.entities.Product;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.entities.Wishlist;
import tn.esprit.projetintegre.exception.ResourceNotFoundException;
import tn.esprit.projetintegre.repositories.ProductRepository;
import tn.esprit.projetintegre.repositories.UserRepository;
import tn.esprit.projetintegre.repositories.WishlistRepository;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public List<Wishlist> getAllWishlists() {
        return wishlistRepository.findAll();
    }

    public Wishlist getWishlistById(Long id) {
        return wishlistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Wishlist not found with id: " + id));
    }

    public List<Wishlist> getWishlistsByUserId(Long userId) {
        return wishlistRepository.findByUserId(userId);
    }

    public Wishlist createWishlist(Wishlist wishlist, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        wishlist.setUser(user);
        if (wishlist.getName() == null || wishlist.getName().isEmpty()) {
            wishlist.setName("My Wishlist");
        }
        if (wishlist.getIsPublic() == null) {
            wishlist.setIsPublic(false);
        }
        wishlist.setProducts(new ArrayList<>());
        return wishlistRepository.save(wishlist);
    }

    public Wishlist updateWishlist(Long id, Wishlist wishlistDetails) {
        Wishlist wishlist = getWishlistById(id);
        wishlist.setName(wishlistDetails.getName());
        wishlist.setIsPublic(wishlistDetails.getIsPublic());
        return wishlistRepository.save(wishlist);
    }

    public Wishlist addProductToWishlist(Long wishlistId, Long productId) {
        Wishlist wishlist = getWishlistById(wishlistId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        if (!wishlist.getProducts().contains(product)) {
            wishlist.getProducts().add(product);
            return wishlistRepository.save(wishlist);
        }
        return wishlist;
    }

    public Wishlist removeProductFromWishlist(Long wishlistId, Long productId) {
        Wishlist wishlist = getWishlistById(wishlistId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        wishlist.getProducts().remove(product);
        return wishlistRepository.save(wishlist);
    }

    public void deleteWishlist(Long id) {
        Wishlist wishlist = getWishlistById(id);
        wishlistRepository.delete(wishlist);
    }
}
