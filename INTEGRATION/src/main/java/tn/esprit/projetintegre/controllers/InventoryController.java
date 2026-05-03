package tn.esprit.projetintegre.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.projetintegre.dto.ApiResponse;
import tn.esprit.projetintegre.dto.PageResponse;
import tn.esprit.projetintegre.dto.request.InventoryRequest;
import tn.esprit.projetintegre.dto.response.InventoryResponse;
import tn.esprit.projetintegre.entities.Inventory;
import tn.esprit.projetintegre.mapper.DtoMapper;
import tn.esprit.projetintegre.services.InventoryService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Inventory management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class InventoryController {

    private final InventoryService inventoryService;
    private final DtoMapper dtoMapper;

    @GetMapping
    @Operation(summary = "Get all inventory items with pagination")
    public ResponseEntity<ApiResponse<PageResponse<InventoryResponse>>> getAllInventory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Page<Inventory> inventory = inventoryService.getAllInventory(PageRequest.of(page, size, sort));
        Page<InventoryResponse> response = inventory.map(dtoMapper::toInventoryResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/all")
    @Operation(summary = "Get all inventory items (no pagination)")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> getAllInventoryList() {
        List<Inventory> inventory = inventoryService.getAllInventory();
        List<InventoryResponse> response = inventory.stream()
                .map(dtoMapper::toInventoryResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get inventory item by ID")
    public ResponseEntity<ApiResponse<InventoryResponse>> getInventoryById(@PathVariable Long id) {
        Inventory inventory = inventoryService.getInventoryById(id);
        return ResponseEntity.ok(ApiResponse.success(dtoMapper.toInventoryResponse(inventory)));
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get inventory by product ID")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> getInventoryByProduct(@PathVariable Long productId) {
        List<Inventory> inventory = inventoryService.getInventoryByProduct(productId);
        List<InventoryResponse> response = inventory.stream()
                .map(dtoMapper::toInventoryResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/warehouse/{warehouseId}")
    @Operation(summary = "Get inventory by warehouse ID")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> getInventoryByWarehouse(@PathVariable Long warehouseId) {
        List<Inventory> inventory = inventoryService.getInventoryByWarehouse(warehouseId);
        List<InventoryResponse> response = inventory.stream()
                .map(dtoMapper::toInventoryResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Get low stock items")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> getLowStockItems() {
        List<Inventory> inventory = inventoryService.getLowStockItems();
        List<InventoryResponse> response = inventory.stream()
                .map(dtoMapper::toInventoryResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/low-stock/warehouse/{warehouseId}")
    @Operation(summary = "Get low stock items by warehouse")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> getLowStockByWarehouse(@PathVariable Long warehouseId) {
        List<Inventory> inventory = inventoryService.getLowStockByWarehouse(warehouseId);
        List<InventoryResponse> response = inventory.stream()
                .map(dtoMapper::toInventoryResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @Operation(summary = "Create new inventory item")
    public ResponseEntity<ApiResponse<InventoryResponse>> createInventory(
            @Valid @RequestBody InventoryRequest request) {
        Inventory inventory = inventoryService.createInventory(request);
        return ResponseEntity.ok(ApiResponse.success("Inventory created successfully", dtoMapper.toInventoryResponse(inventory)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @Operation(summary = "Update inventory item")
    public ResponseEntity<ApiResponse<InventoryResponse>> updateInventory(
            @PathVariable Long id,
            @Valid @RequestBody InventoryRequest request) {
        Inventory inventory = inventoryService.updateInventory(id, request);
        return ResponseEntity.ok(ApiResponse.success("Inventory updated successfully", dtoMapper.toInventoryResponse(inventory)));
    }

    @PostMapping("/{id}/adjust")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @Operation(summary = "Adjust stock quantity")
    public ResponseEntity<ApiResponse<InventoryResponse>> adjustStock(
            @PathVariable Long id,
            @RequestParam Integer adjustment,
            @RequestParam(required = false) String reason) {
        Inventory inventory = inventoryService.adjustStock(id, adjustment, reason);
        return ResponseEntity.ok(ApiResponse.success("Stock adjusted successfully", dtoMapper.toInventoryResponse(inventory)));
    }

    @PostMapping("/{id}/reserve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @Operation(summary = "Reserve stock")
    public ResponseEntity<ApiResponse<InventoryResponse>> reserveStock(
            @PathVariable Long id,
            @RequestParam Integer quantity) {
        Inventory inventory = inventoryService.reserveStock(id, quantity);
        return ResponseEntity.ok(ApiResponse.success("Stock reserved successfully", dtoMapper.toInventoryResponse(inventory)));
    }

    @PostMapping("/{id}/release")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @Operation(summary = "Release reserved stock")
    public ResponseEntity<ApiResponse<InventoryResponse>> releaseReservedStock(
            @PathVariable Long id,
            @RequestParam Integer quantity) {
        Inventory inventory = inventoryService.releaseReservedStock(id, quantity);
        return ResponseEntity.ok(ApiResponse.success("Reserved stock released successfully", dtoMapper.toInventoryResponse(inventory)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete inventory item")
    public ResponseEntity<ApiResponse<Void>> deleteInventory(@PathVariable Long id) {
        inventoryService.deleteInventory(id);
        return ResponseEntity.ok(ApiResponse.success("Inventory deleted successfully", null));
    }
}
