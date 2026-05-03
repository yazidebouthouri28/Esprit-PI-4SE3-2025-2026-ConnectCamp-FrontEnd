package tn.esprit.projetintegre.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.projetintegre.dto.request.InventoryRequest;
import tn.esprit.projetintegre.entities.Inventory;
import tn.esprit.projetintegre.entities.Product;
import tn.esprit.projetintegre.entities.Warehouse;
import tn.esprit.projetintegre.repositories.InventoryRepository;
import tn.esprit.projetintegre.repositories.ProductRepository;
import tn.esprit.projetintegre.repositories.WarehouseRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;

    public Page<Inventory> getAllInventory(Pageable pageable) {
        return inventoryRepository.findAll(pageable);
    }

    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    public Inventory getInventoryById(Long id) {
        return inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory not found with id: " + id));
    }

    public List<Inventory> getInventoryByProduct(Long productId) {
        return inventoryRepository.findByProductId(productId);
    }

    public List<Inventory> getInventoryByWarehouse(Long warehouseId) {
        return inventoryRepository.findByWarehouseId(warehouseId);
    }

    public Inventory getInventoryByProductAndWarehouse(Long productId, Long warehouseId) {
        return inventoryRepository.findByProductIdAndWarehouseId(productId, warehouseId)
                .orElseThrow(() -> new RuntimeException("Inventory not found for product " + productId + " in warehouse " + warehouseId));
    }

    public Inventory createInventory(InventoryRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        // Check if inventory already exists for this product-warehouse combination
        if (inventoryRepository.findByProductIdAndWarehouseId(request.getProductId(), request.getWarehouseId()).isPresent()) {
            throw new RuntimeException("Inventory already exists for this product in this warehouse");
        }

        Inventory inventory = Inventory.builder()
                .product(product)
                .warehouse(warehouse)
                .sku(request.getSku() != null ? request.getSku() : product.getSku())
                .quantity(request.getQuantity() != null ? request.getQuantity() : 0)
                .reservedQuantity(0)
                .lowStockThreshold(request.getLowStockThreshold() != null ? request.getLowStockThreshold() : 10)
                .safetyStock(request.getSafetyStock() != null ? request.getSafetyStock() : 5)
                .reorderQuantity(request.getReorderQuantity())
                .location(request.getLocation())
                .aisle(request.getAisle())
                .shelf(request.getShelf())
                .bin(request.getBin())
                .build();

        return inventoryRepository.save(inventory);
    }

    public Inventory updateInventory(Long id, InventoryRequest request) {
        Inventory inventory = getInventoryById(id);

        if (request.getQuantity() != null) inventory.setQuantity(request.getQuantity());
        if (request.getReservedQuantity() != null) inventory.setReservedQuantity(request.getReservedQuantity());
        if (request.getLowStockThreshold() != null) inventory.setLowStockThreshold(request.getLowStockThreshold());
        if (request.getSafetyStock() != null) inventory.setSafetyStock(request.getSafetyStock());
        if (request.getReorderQuantity() != null) inventory.setReorderQuantity(request.getReorderQuantity());
        if (request.getLocation() != null) inventory.setLocation(request.getLocation());
        if (request.getAisle() != null) inventory.setAisle(request.getAisle());
        if (request.getShelf() != null) inventory.setShelf(request.getShelf());
        if (request.getBin() != null) inventory.setBin(request.getBin());

        return inventoryRepository.save(inventory);
    }

    public Inventory adjustStock(Long id, Integer adjustment, String reason) {
        Inventory inventory = getInventoryById(id);
        int newQuantity = inventory.getQuantity() + adjustment;
        
        if (newQuantity < 0) {
            throw new RuntimeException("Stock cannot be negative. Current: " + inventory.getQuantity() + ", Adjustment: " + adjustment);
        }

        inventory.setQuantity(newQuantity);
        if (adjustment > 0) {
            inventory.setLastRestocked(LocalDateTime.now());
        }
        inventory.setLastStockCheck(LocalDateTime.now());

        // Also update product stock
        Product product = inventory.getProduct();
        Integer totalStock = inventoryRepository.getTotalStockByProduct(product.getId());
        product.setStockQuantity(totalStock != null ? totalStock + adjustment : adjustment);
        productRepository.save(product);

        return inventoryRepository.save(inventory);
    }

    public Inventory reserveStock(Long id, Integer quantity) {
        Inventory inventory = getInventoryById(id);
        int available = inventory.getQuantity() - inventory.getReservedQuantity();
        
        if (quantity > available) {
            throw new RuntimeException("Not enough available stock. Available: " + available + ", Requested: " + quantity);
        }

        inventory.setReservedQuantity(inventory.getReservedQuantity() + quantity);
        return inventoryRepository.save(inventory);
    }

    public Inventory releaseReservedStock(Long id, Integer quantity) {
        Inventory inventory = getInventoryById(id);
        
        if (quantity > inventory.getReservedQuantity()) {
            throw new RuntimeException("Cannot release more than reserved. Reserved: " + inventory.getReservedQuantity());
        }

        inventory.setReservedQuantity(inventory.getReservedQuantity() - quantity);
        return inventoryRepository.save(inventory);
    }

    public void deleteInventory(Long id) {
        inventoryRepository.deleteById(id);
    }

    public List<Inventory> getLowStockItems() {
        return inventoryRepository.findLowStockItems();
    }

    public List<Inventory> getLowStockByWarehouse(Long warehouseId) {
        return inventoryRepository.findLowStockByWarehouse(warehouseId);
    }

    public Integer getTotalStockByProduct(Long productId) {
        Integer total = inventoryRepository.getTotalStockByProduct(productId);
        return total != null ? total : 0;
    }
}
