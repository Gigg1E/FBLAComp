-- Sample Users
-- Password for all users is: password123
INSERT INTO users (email, password_hash, username, role) VALUES
('john@example.com', '$2b$10$rYjqz5vG8K8KxQXz9L5xVeXZHJ5M5fGxJ9V3K3J3J3J3J3J3J3J3J', 'john_doe', 'user'),
('sarah@example.com', '$2b$10$rYjqz5vG8K8KxQXz9L5xVeXZHJ5M5fGxJ9V3K3J3J3J3J3J3J3J3J', 'sarah_smith', 'user'),
('owner1@business.com', '$2b$10$rYjqz5vG8K8KxQXz9L5xVeXZHJ5M5fGxJ9V3K3J3J3J3J3J3J3J3J', 'pizza_owner', 'business_owner'),
('owner2@business.com', '$2b$10$rYjqz5vG8K8KxQXz9L5xVeXZHJ5M5fGxJ9V3K3J3J3J3J3J3J3J3J', 'cafe_owner', 'business_owner'),
('admin@site.com', '$2b$10$rYjqz5vG8K8KxQXz9L5xVeXZHJ5M5fGxJ9V3K3J3J3J3J3J3J3J3J', 'admin', 'admin');

-- Sample Businesses
INSERT INTO businesses (name, category, address, city, state, zip_code, phone, email, website, description, owner_id, verified) VALUES
('Mario''s Pizza Place', 'Restaurant', '123 Main Street', 'Springfield', 'IL', '62701', '555-0101', 'contact@mariospizza.com', 'www.mariospizza.com', 'Family-owned Italian restaurant serving authentic pizza and pasta since 1995.', 3, 1),
('The Coffee Corner', 'Cafe', '456 Oak Avenue', 'Springfield', 'IL', '62702', '555-0102', 'hello@coffeecorner.com', 'www.coffeecorner.com', 'Cozy cafe with fresh-roasted coffee and homemade pastries.', 4, 1),
('Tech Repair Pro', 'Electronics', '789 Elm Street', 'Springfield', 'IL', '62703', '555-0103', 'support@techrepairpro.com', 'www.techrepairpro.com', 'Professional computer and phone repair services. Same-day service available.', NULL, 1),
('Green Thumb Nursery', 'Garden Center', '321 Pine Road', 'Springfield', 'IL', '62704', '555-0104', 'info@greenthumb.com', 'www.greenthumb.com', 'Local plant nursery with a wide variety of flowers, trees, and gardening supplies.', NULL, 1),
('Fitness First Gym', 'Fitness', '654 Maple Drive', 'Springfield', 'IL', '62705', '555-0105', 'join@fitnessfirst.com', 'www.fitnessfirst.com', 'Full-service gym with modern equipment, personal trainers, and group classes.', NULL, 1),
('Bob''s Auto Shop', 'Auto Repair', '987 Cedar Lane', 'Springfield', 'IL', '62706', '555-0106', 'service@bobsauto.com', 'www.bobsauto.com', 'Trusted auto repair and maintenance services for all vehicle makes and models.', NULL, 1),
('Sweet Treats Bakery', 'Bakery', '147 Birch Street', 'Springfield', 'IL', '62707', '555-0107', 'orders@sweettreats.com', 'www.sweettreats.com', 'Artisan bakery specializing in custom cakes, cookies, and fresh bread.', NULL, 1),
('Downtown Books', 'Bookstore', '258 Walnut Avenue', 'Springfield', 'IL', '62708', '555-0108', 'info@downtownbooks.com', 'www.downtownbooks.com', 'Independent bookstore featuring local authors and a cozy reading area.', NULL, 1);

-- Sample Reviews
INSERT INTO reviews (business_id, user_id, rating, title, review_text) VALUES
(1, 1, 5, 'Best pizza in town!', 'The pizza here is absolutely amazing. The crust is perfect and the ingredients are always fresh. Highly recommend the Margherita!'),
(1, 2, 4, 'Great food, slow service', 'The food quality is excellent but we had to wait a bit long for our order. Still worth it though!'),
(2, 1, 5, 'My favorite coffee spot', 'I come here every morning. The baristas are friendly and the coffee is consistently good. Love the atmosphere!'),
(3, 2, 5, 'Fixed my phone quickly', 'They repaired my cracked screen in less than an hour. Professional service and fair pricing.'),
(4, 1, 4, 'Great plant selection', 'Found exactly what I needed for my garden. Staff was very helpful with care instructions.'),
(5, 2, 3, 'Good gym but crowded', 'The equipment is modern and well-maintained but it gets really crowded in the evenings.'),
(6, 1, 5, 'Honest and reliable', 'Bob''s team diagnosed the problem accurately and fixed it for a reasonable price. No unnecessary upselling.'),
(7, 2, 5, 'Amazing custom cakes', 'They made the perfect birthday cake for my daughter. Beautiful design and delicious taste!');

-- Sample Deals
INSERT INTO deals (business_id, title, description, discount_amount, start_date, end_date, active) VALUES
(1, '2-for-1 Pizza Tuesday', 'Buy one large pizza, get a second large pizza free every Tuesday!', 'BOGO', '2025-01-01', '2025-12-31', 1),
(2, 'Happy Hour Special', 'Get 20% off all drinks from 3-5 PM Monday through Friday.', '20% off', '2025-01-01', '2025-12-31', 1),
(3, 'Screen Repair Discount', 'Save $15 on any phone screen repair this month.', '$15 off', '2025-01-01', '2025-01-31', 1),
(5, 'New Member Special', 'Sign up now and get your first month 50% off!', '50% off first month', '2025-01-01', '2025-03-31', 1);
