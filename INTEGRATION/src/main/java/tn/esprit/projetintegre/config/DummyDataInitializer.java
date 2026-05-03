package tn.esprit.projetintegre.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.entities.Product;
import tn.esprit.projetintegre.entities.User;
import tn.esprit.projetintegre.entities.Wallet;
import tn.esprit.projetintegre.enums.Role;
import tn.esprit.projetintegre.repositories.ProductRepository;
import tn.esprit.projetintegre.repositories.UserRepository;
import tn.esprit.projetintegre.repositories.WalletRepository;

import java.math.BigDecimal;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class DummyDataInitializer implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Initialize a deterministic seller used by seeded products.
        User defaultUser = userRepository.findByUsername("seller_seed")
                .map(this::ensureSeedUserCanSell)
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .name("Default Seller")
                                .username("seller_seed")
                                .email("seller_seed@example.com")
                                .password("password")
                                .role(Role.SELLER)
                                .isSeller(true)
                                .isBuyer(true)
                                .build()
                ));

        // Initialize Wallet for User 1 if not exists
        Optional<Wallet> optionalWallet = walletRepository.findByUserId(defaultUser.getId());
        if (optionalWallet.isEmpty()) {
            Wallet newWallet = Wallet.builder()
                .user(defaultUser)
                .balance(new BigDecimal("5000.00")) // Generous balance to allow testing
                .currency("DT")
                .isActive(true)
                .build();
            walletRepository.save(newWallet);
        }

        // Keep the marketplace usable even when an existing database contains
        // only inactive products.
        String[] names = {
            "Family Camping Setup", "Night Forest Tent", "Mountain View Tent", "Sunset Ridge Tent",
            "Glacier Point Sleeping Bag", "Trailblazer 65L Backpack", "Portable Camp Stove", "LED Camping Lantern",
            "Alpine Zero Sleeping Bag", "Ultralight Sleeping Pad", "Titanium Cookset", "Rugged 30L Cooler",
            "Dayhiker 25L Pack", "Expedition 85L Pack", "Pro Headlamp 500", "Camping Multi-Tool",
            "Compact First Aid Kit", "Portable Camping Chair"
        };
        double[] prices = { 299, 149, 189, 219, 89, 159, 45, 25, 129, 75, 65, 199, 85, 249, 35, 55, 29, 49 };

        for (int i = 0; i < names.length; i++) {
            String name = names[i];
            BigDecimal price = new BigDecimal(prices[i]);

            Product product = productRepository.findByName(name)
                    .orElseGet(() -> Product.builder()
                            .name(name)
                            .price(price)
                            .stockQuantity(100)
                            .seller(defaultUser)
                            .build());

            product.setPrice(price);
            product.setStockQuantity(product.getStockQuantity() == null || product.getStockQuantity() <= 0 ? 100 : product.getStockQuantity());
            product.setSeller(product.getSeller() == null ? defaultUser : product.getSeller());
            product.setIsActive(true);
            productRepository.save(product);
        }

        repairUnavailableActiveProducts(defaultUser);
    }

    private void repairUnavailableActiveProducts(User defaultUser) {
        productRepository.findAll().stream()
                .filter(product -> Boolean.TRUE.equals(product.getIsActive()))
                .filter(product -> product.getStockQuantity() == null || product.getStockQuantity() <= 0)
                .forEach(product -> {
                    product.setStockQuantity(100);
                    if (product.getSeller() == null) {
                        product.setSeller(defaultUser);
                    }
                    productRepository.save(product);
                });
    }

    private User ensureSeedUserCanSell(User user) {
        boolean updated = false;
        if (!Boolean.TRUE.equals(user.getIsSeller())) {
            user.setIsSeller(true);
            updated = true;
        }
        if (user.getRole() != Role.SELLER) {
            user.setRole(Role.SELLER);
            updated = true;
        }
        return updated ? userRepository.save(user) : user;
    }
}
