-- Drop old product_requirements table
DROP TABLE IF EXISTS `product_requirements`;

-- Delete old migration records  
DELETE FROM `django_migrations` WHERE `app` = 'product_requirements';
