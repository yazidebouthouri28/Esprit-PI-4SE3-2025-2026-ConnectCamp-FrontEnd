# Projet Spring Boot Intégré

Un projet Spring Boot complet avec toutes les fonctionnalités de gestion d'une plateforme e-commerce, événements, réservations, gamification et plus.

## 🚀 Technologies

- **Java 17**
- **Spring Boot 3.2.5**
- **Spring Security avec JWT**
- **Spring Data JPA**
- **MySQL**
- **Swagger/OpenAPI 3**
- **Lombok**
- **Bean Validation (Jakarta Validation)**

## ✅ Fonctionnalités Principales

### Validation des Données
- Validation complète de toutes les entités avec messages en français
- Annotations Bean Validation: `@NotNull`, `@NotBlank`, `@Size`, `@Email`, `@Min`, `@Max`, `@DecimalMin`, `@DecimalMax`, `@Pattern`, `@Past`, `@Future`, `@FutureOrPresent`
- Validation personnalisée avec `@AssertTrue` pour les règles métier complexes
- Messages d'erreur personnalisés en français

### Optimisations
- Indexes de base de données sur les colonnes fréquemment recherchées
- Relations JPA avec `FetchType.LAZY` pour optimiser les performances
- Requêtes JPQL optimisées avec `JOIN FETCH` pour éviter les N+1 queries
- Pagination sur tous les endpoints qui retournent des listes

### Gestion des Erreurs
- Handler global d'exceptions avec messages clairs
- Gestion des erreurs de validation avec liste des champs en erreur
- Codes HTTP appropriés (400, 401, 403, 404, 409, 500)

## 📦 Modules

### 1. Authentification & Utilisateurs
- Authentification JWT
- Gestion des utilisateurs
- Rôles (USER, ADMIN, SELLER)

### 2. E-commerce
- Produits & Catégories
- Panier & Commandes
- Avis produits
- Wishlists
- Coupons & Promotions

### 3. Événements & Tickets
- Gestion des événements
- Réservation de tickets
- Sponsors & Sponsorships

### 4. Réservations & Services
- Sites de camping
- Réservations de sites
- Services de camping
- Alertes

### 5. Finance & Abonnements
- Portefeuilles
- Transactions
- Abonnements
- Remboursements

### 6. Gamification
- Missions
- Achievements
- Points de fidélité

### 7. Forum & Notifications
- Articles de forum
- Commentaires
- Notifications
- Réclamations

---

## 🔗 API Endpoints

### Auth (`/auth`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/register` | Inscription |
| POST | `/auth/login` | Connexion |

### Users (`/api/users`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/users` | Liste tous les utilisateurs |
| GET | `/api/users/{id}` | Récupérer par ID |
| GET | `/api/users/username/{username}` | Récupérer par username |
| PUT | `/api/users/{id}` | Mettre à jour |
| PUT | `/api/users/{id}/become-seller` | Devenir vendeur |
| PUT | `/api/users/{id}/role` | Changer le rôle |
| PUT | `/api/users/{id}/suspend` | Suspendre |
| PUT | `/api/users/{id}/unsuspend` | Réactiver |
| DELETE | `/api/users/{id}` | Supprimer |

### Products (`/api/products`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/products` | Liste tous les produits |
| GET | `/api/products/{id}` | Récupérer par ID |
| GET | `/api/products/category/{categoryId}` | Par catégorie |
| GET | `/api/products/seller/{sellerId}` | Par vendeur |
| GET | `/api/products/search` | Rechercher |
| POST | `/api/products` | Créer |
| PUT | `/api/products/{id}` | Mettre à jour |
| DELETE | `/api/products/{id}` | Supprimer |

### Categories (`/api/categories`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/categories` | Liste toutes les catégories |
| GET | `/api/categories/{id}` | Récupérer par ID |
| GET | `/api/categories/slug/{slug}` | Par slug |
| GET | `/api/categories/root` | Catégories racines |
| GET | `/api/categories/{id}/subcategories` | Sous-catégories |
| POST | `/api/categories` | Créer |
| PUT | `/api/categories/{id}` | Mettre à jour |
| DELETE | `/api/categories/{id}` | Supprimer |

### Cart (`/api/cart`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/cart/{userId}` | Récupérer panier |
| POST | `/api/cart/{userId}/items` | Ajouter produit |
| PUT | `/api/cart/{userId}/items/{itemId}` | Modifier quantité |
| DELETE | `/api/cart/{userId}/items/{itemId}` | Supprimer produit |
| DELETE | `/api/cart/{userId}` | Vider panier |

### Orders (`/api/orders`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/orders` | Liste toutes les commandes |
| GET | `/api/orders/{id}` | Récupérer par ID |
| GET | `/api/orders/number/{orderNumber}` | Par numéro |
| GET | `/api/orders/user/{userId}` | Par utilisateur |
| GET | `/api/orders/status/{status}` | Par statut |
| POST | `/api/orders/user/{userId}` | Créer commande |
| PUT | `/api/orders/{id}/status` | Changer statut |
| PUT | `/api/orders/{id}/payment-status` | Changer statut paiement |

### Reviews (`/api/reviews`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/reviews` | Liste tous les avis |
| GET | `/api/reviews/{id}` | Récupérer par ID |
| GET | `/api/reviews/product/{productId}` | Par produit |
| GET | `/api/reviews/user/{userId}` | Par utilisateur |
| POST | `/api/reviews` | Créer |
| PUT | `/api/reviews/{id}` | Mettre à jour |
| PUT | `/api/reviews/{id}/approve` | Approuver |
| DELETE | `/api/reviews/{id}` | Supprimer |

### Wishlists (`/api/wishlists`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/wishlists` | Liste toutes les wishlists |
| GET | `/api/wishlists/{id}` | Récupérer par ID |
| GET | `/api/wishlists/user/{userId}` | Par utilisateur |
| POST | `/api/wishlists` | Créer |
| PUT | `/api/wishlists/{id}` | Mettre à jour |
| POST | `/api/wishlists/{id}/products/{productId}` | Ajouter produit |
| DELETE | `/api/wishlists/{id}/products/{productId}` | Retirer produit |
| DELETE | `/api/wishlists/{id}` | Supprimer |

### Coupons (`/api/coupons`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/coupons` | Liste tous les coupons |
| GET | `/api/coupons/{id}` | Récupérer par ID |
| GET | `/api/coupons/code/{code}` | Par code |
| GET | `/api/coupons/validate/{code}` | Valider coupon |
| POST | `/api/coupons` | Créer |
| PUT | `/api/coupons/{id}` | Mettre à jour |
| DELETE | `/api/coupons/{id}` | Supprimer |

### Promotions (`/api/promotions`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/promotions` | Liste toutes les promotions |
| GET | `/api/promotions/{id}` | Récupérer par ID |
| GET | `/api/promotions/active` | Promotions actives |
| GET | `/api/promotions/valid` | Promotions valides |
| POST | `/api/promotions` | Créer |
| PUT | `/api/promotions/{id}` | Mettre à jour |
| PUT | `/api/promotions/{id}/activate` | Activer |
| PUT | `/api/promotions/{id}/deactivate` | Désactiver |
| DELETE | `/api/promotions/{id}` | Supprimer |

### Events (`/api/events`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/events` | Liste tous les événements |
| GET | `/api/events/{id}` | Récupérer par ID |
| GET | `/api/events/upcoming` | Événements à venir |
| GET | `/api/events/search` | Rechercher |
| GET | `/api/events/organizer/{organizerId}` | Par organisateur |
| GET | `/api/events/site/{siteId}` | Par site |
| POST | `/api/events` | Créer |
| PUT | `/api/events/{id}` | Mettre à jour |
| PUT | `/api/events/{id}/status` | Changer statut |
| PUT | `/api/events/{id}/publish` | Publier |
| DELETE | `/api/events/{id}` | Supprimer |

### Tickets (`/api/tickets`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/tickets` | Liste tous les tickets |
| GET | `/api/tickets/{id}` | Récupérer par ID |
| GET | `/api/tickets/number/{ticketNumber}` | Par numéro |
| GET | `/api/tickets/user/{userId}` | Par utilisateur |
| GET | `/api/tickets/event/{eventId}` | Par événement |
| POST | `/api/tickets/purchase` | Acheter ticket |
| PUT | `/api/tickets/{id}/use` | Utiliser ticket |
| PUT | `/api/tickets/{id}/validate` | Valider ticket |

### Sponsors (`/api/sponsors`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/sponsors` | Liste tous les sponsors |
| GET | `/api/sponsors/{id}` | Récupérer par ID |
| GET | `/api/sponsors/active` | Sponsors actifs |
| GET | `/api/sponsors/search` | Rechercher |
| POST | `/api/sponsors` | Créer |
| PUT | `/api/sponsors/{id}` | Mettre à jour |
| DELETE | `/api/sponsors/{id}` | Supprimer |

### Sponsorships (`/api/sponsors/sponsorships`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/sponsors/sponsorships` | Liste toutes les sponsorisations |
| GET | `/api/sponsors/sponsorships/{id}` | Récupérer par ID |
| GET | `/api/sponsors/{sponsorId}/sponsorships` | Par sponsor |
| GET | `/api/sponsors/sponsorships/event/{eventId}` | Par événement |
| POST | `/api/sponsors/sponsorships` | Créer |
| PUT | `/api/sponsors/sponsorships/{id}` | Mettre à jour |
| PUT | `/api/sponsors/sponsorships/{id}/mark-paid` | Marquer payé |
| PUT | `/api/sponsors/sponsorships/{id}/status` | Changer statut |
| DELETE | `/api/sponsors/sponsorships/{id}` | Supprimer |

### Sites (`/api/sites`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/sites` | Liste tous les sites |
| GET | `/api/sites/{id}` | Récupérer par ID |
| GET | `/api/sites/active` | Sites actifs |
| GET | `/api/sites/search` | Rechercher |
| GET | `/api/sites/owner/{ownerId}` | Par propriétaire |
| POST | `/api/sites` | Créer |
| PUT | `/api/sites/{id}` | Mettre à jour |
| DELETE | `/api/sites/{id}` | Supprimer |

### Reservations (`/api/reservations`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/reservations` | Liste toutes les réservations |
| GET | `/api/reservations/{id}` | Récupérer par ID |
| GET | `/api/reservations/number/{reservationNumber}` | Par numéro |
| GET | `/api/reservations/user/{userId}` | Par utilisateur |
| GET | `/api/reservations/site/{siteId}` | Par site |
| GET | `/api/reservations/check-availability` | Vérifier disponibilité |
| POST | `/api/reservations` | Créer |
| PUT | `/api/reservations/{id}/status` | Changer statut |
| PUT | `/api/reservations/{id}/cancel` | Annuler |
| DELETE | `/api/reservations/{id}` | Supprimer |

### Camping Services (`/api/camping-services`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/camping-services` | Liste tous les services |
| GET | `/api/camping-services/{id}` | Récupérer par ID |
| GET | `/api/camping-services/active` | Services actifs |
| GET | `/api/camping-services/type/{type}` | Par type |
| GET | `/api/camping-services/site/{siteId}` | Par site |
| GET | `/api/camping-services/provider/{providerId}` | Par prestataire |
| POST | `/api/camping-services` | Créer |
| PUT | `/api/camping-services/{id}` | Mettre à jour |
| DELETE | `/api/camping-services/{id}` | Supprimer |

### Alerts (`/api/alerts`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/alerts` | Liste toutes les alertes |
| GET | `/api/alerts/{id}` | Récupérer par ID |
| GET | `/api/alerts/status/{status}` | Par statut |
| GET | `/api/alerts/site/{siteId}` | Par site |
| POST | `/api/alerts` | Créer |
| PUT | `/api/alerts/{id}` | Mettre à jour |
| PUT | `/api/alerts/{id}/resolve` | Résoudre |
| DELETE | `/api/alerts/{id}` | Supprimer |

### Wallets (`/api/wallets`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/wallets` | Liste tous les portefeuilles |
| GET | `/api/wallets/{id}` | Récupérer par ID |
| GET | `/api/wallets/user/{userId}` | Par utilisateur |
| GET | `/api/wallets/user/{userId}/balance` | Solde |
| POST | `/api/wallets/user/{userId}/add-funds` | Ajouter fonds |
| POST | `/api/wallets/user/{userId}/deduct-funds` | Déduire fonds |
| PUT | `/api/wallets/user/{userId}/deactivate` | Désactiver |
| PUT | `/api/wallets/user/{userId}/activate` | Activer |

### Transactions (`/api/transactions`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/transactions` | Liste toutes les transactions |
| GET | `/api/transactions/{id}` | Récupérer par ID |
| GET | `/api/transactions/number/{transactionNumber}` | Par numéro |
| GET | `/api/transactions/user/{userId}` | Par utilisateur |
| GET | `/api/transactions/wallet/{walletId}` | Par portefeuille |
| GET | `/api/transactions/type/{type}` | Par type |
| POST | `/api/transactions` | Créer |

### Subscriptions (`/api/subscriptions`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/subscriptions` | Liste tous les abonnements |
| GET | `/api/subscriptions/{id}` | Récupérer par ID |
| GET | `/api/subscriptions/user/{userId}` | Par utilisateur |
| GET | `/api/subscriptions/user/{userId}/active` | Abonnements actifs |
| GET | `/api/subscriptions/status/{status}` | Par statut |
| POST | `/api/subscriptions` | Créer |
| PUT | `/api/subscriptions/{id}/activate` | Activer |
| PUT | `/api/subscriptions/{id}/cancel` | Annuler |
| PUT | `/api/subscriptions/{id}/suspend` | Suspendre |
| PUT | `/api/subscriptions/{id}/renew` | Renouveler |
| DELETE | `/api/subscriptions/{id}` | Supprimer |

### Refunds (`/api/refunds`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/refunds` | Liste tous les remboursements |
| GET | `/api/refunds/{id}` | Récupérer par ID |
| GET | `/api/refunds/number/{refundNumber}` | Par numéro |
| GET | `/api/refunds/user/{userId}` | Par utilisateur |
| GET | `/api/refunds/order/{orderId}` | Par commande |
| GET | `/api/refunds/status/{status}` | Par statut |
| POST | `/api/refunds` | Créer |
| PUT | `/api/refunds/{id}/approve` | Approuver |
| PUT | `/api/refunds/{id}/reject` | Rejeter |
| DELETE | `/api/refunds/{id}` | Supprimer |

### Missions (`/api/missions`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/missions` | Liste toutes les missions |
| GET | `/api/missions/{id}` | Récupérer par ID |
| GET | `/api/missions/active` | Missions actives |
| GET | `/api/missions/type/{type}` | Par type |
| GET | `/api/missions/user/{userId}` | Missions utilisateur |
| POST | `/api/missions` | Créer |
| PUT | `/api/missions/{id}` | Mettre à jour |
| POST | `/api/missions/{missionId}/assign/{userId}` | Assigner |
| PUT | `/api/missions/user-mission/{id}/progress` | Mettre à jour progrès |
| POST | `/api/missions/user-mission/{id}/claim-reward` | Réclamer récompense |
| DELETE | `/api/missions/{id}` | Supprimer |

### Achievements (`/api/achievements`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/achievements` | Liste tous les achievements |
| GET | `/api/achievements/{id}` | Récupérer par ID |
| GET | `/api/achievements/active` | Achievements actifs |
| GET | `/api/achievements/category/{category}` | Par catégorie |
| GET | `/api/achievements/user/{userId}` | Achievements utilisateur |
| GET | `/api/achievements/user/{userId}/displayed` | Affichés |
| POST | `/api/achievements` | Créer |
| PUT | `/api/achievements/{id}` | Mettre à jour |
| POST | `/api/achievements/{id}/unlock/{userId}` | Débloquer |
| PUT | `/api/achievements/user-achievement/{id}/toggle-display` | Toggle affichage |
| DELETE | `/api/achievements/{id}` | Supprimer |

### Forum (`/api/forum`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/forum/articles` | Liste tous les articles |
| GET | `/api/forum/articles/{id}` | Récupérer par ID |
| GET | `/api/forum/articles/published` | Articles publiés |
| GET | `/api/forum/articles/author/{authorId}` | Par auteur |
| GET | `/api/forum/articles/category/{category}` | Par catégorie |
| GET | `/api/forum/articles/pinned` | Articles épinglés |
| GET | `/api/forum/articles/search` | Rechercher |
| POST | `/api/forum/articles` | Créer |
| PUT | `/api/forum/articles/{id}` | Mettre à jour |
| POST | `/api/forum/articles/{id}/like` | Aimer |
| DELETE | `/api/forum/articles/{id}` | Supprimer |
| GET | `/api/forum/articles/{articleId}/comments` | Commentaires |
| POST | `/api/forum/comments` | Créer commentaire |
| PUT | `/api/forum/comments/{id}` | Mettre à jour |
| POST | `/api/forum/comments/{id}/like` | Aimer |
| DELETE | `/api/forum/comments/{id}` | Supprimer |

### Complaints (`/api/complaints`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/complaints` | Liste toutes les réclamations |
| GET | `/api/complaints/{id}` | Récupérer par ID |
| GET | `/api/complaints/number/{complaintNumber}` | Par numéro |
| GET | `/api/complaints/user/{userId}` | Par utilisateur |
| GET | `/api/complaints/status/{status}` | Par statut |
| POST | `/api/complaints` | Créer |
| PUT | `/api/complaints/{id}` | Mettre à jour |
| PUT | `/api/complaints/{id}/assign` | Assigner |
| PUT | `/api/complaints/{id}/resolve` | Résoudre |
| PUT | `/api/complaints/{id}/close` | Fermer |
| DELETE | `/api/complaints/{id}` | Supprimer |

### Notifications (`/api/notifications`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/notifications/user/{userId}` | Par utilisateur |
| GET | `/api/notifications/user/{userId}/unread` | Non lues |
| GET | `/api/notifications/user/{userId}/count` | Compter non lues |
| PUT | `/api/notifications/{id}/read` | Marquer lu |
| PUT | `/api/notifications/user/{userId}/read-all` | Tout marquer lu |

---

## 📚 Documentation API

La documentation Swagger/OpenAPI est disponible à:
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON**: `http://localhost:8080/v3/api-docs`

## 🔒 Sécurité

- Authentification JWT
- Endpoints publics: `/auth/**`, `/api/public/**`, `/swagger-ui/**`
- CORS configuré pour `localhost:4200` et `localhost:3000`

## 🛠️ Installation

1. Cloner le projet
2. Configurer la base de données MySQL dans `application.properties`
3. Exécuter: `mvn spring-boot:run`

## 📁 Structure du Projet

```
src/main/java/tn/esprit/projetintegre/
├── config/           # Configurations (Security, OpenAPI)
├── controllers/      # REST Controllers
├── dto/              # Data Transfer Objects
│   ├── request/      # Request DTOs
│   └── response/     # Response DTOs
├── entities/         # Entités JPA
├── enums/            # Énumérations
├── exception/        # Gestion des exceptions
├── repositories/     # Repositories JPA
├── security/         # Configuration sécurité JWT
└── services/         # Services métier
```

## 📊 Entités (42 au total)

Achievement, Alert, CampingService, Cart, CartItem, Category, ChatMessage, ChatRoom, Complaint, Coupon, EmergencyAlert, EmergencyIntervention, EmergencyProtocol, EvacuationExercise, Event, ForumArticle, ForumComment, Mission, Notification, Order, OrderItem, Pack, Product, ProductReview, Promotion, PromotionUsage, Refund, Reservation, ServiceApplication, ServiceReview, Site, Sponsor, Sponsorship, Subscription, Ticket, TicketRequest, Transaction, User, UserAchievement, UserMission, Wallet, Wishlist

## 📄 Enums (21 au total)

AlertStatus, BadgeLevel, ChatRoomType, ComplaintStatus, EmergencySeverity, EmergencyType, EventStatus, MessageType, MissionType, OrderStatus, PackType, PaymentStatus, PromotionType, ReservationStatus, Role, ServiceApplicationStatus, ServiceType, SubscriptionStatus, TicketRequestStatus, TicketStatus, TransactionType

## 🔧 Exemples de Validation

### Exemple de validation sur Product Request
```json
{
  "name": "Mon Produit",              // @NotBlank, @Size(min=2, max=200)
  "price": 19.99,                     // @NotNull, @DecimalMin("0.01")
  "description": "Description",       // @Size(max=2000)
  "stockQuantity": 100,               // @Min(0)
  "sellerId": 1                       // @NotNull
}
```

### Messages d'erreur en français
```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "name": "Le nom du produit est obligatoire",
    "price": "Le prix doit être supérieur à 0",
    "sellerId": "L'identifiant du vendeur est obligatoire"
  }
}
```

---

**Développé avec ❤️ en Spring Boot**
