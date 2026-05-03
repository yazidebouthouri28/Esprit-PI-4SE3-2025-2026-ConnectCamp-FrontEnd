package tn.esprit.projetintegre.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InsufficientStockException extends RuntimeException {
    
    public InsufficientStockException(String message) {
        super(message);
    }
    
    public InsufficientStockException(String productName, Integer requested, Integer available) {
        super(String.format("Stock insuffisant pour %s. Demandé: %d, Disponible: %d", productName, requested, available));
    }
}
