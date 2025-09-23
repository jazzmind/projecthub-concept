-- SQL query to remap industry column values to new categories
-- Based on current industry values and target mapping

UPDATE "project" 
SET "industry" = CASE 
    -- Health & Medical Science
    WHEN "industry" = 'Healthcare & Wellness' THEN 'Health & Medical Science'
    
    -- IT, Engineering, & Computer Science  
    WHEN "industry" = 'Technology & Software' THEN 'IT, Engineering, & Computer Science'
    WHEN "industry" = 'Manufacturing & Industrial' THEN 'IT, Engineering, & Computer Science'
    WHEN "industry" = 'Energy & Utilities' THEN 'IT, Engineering, & Computer Science'
    
    -- Law & Public Policy
    WHEN "industry" = 'Legal, Accounting & Consulting Services' THEN 'Law & Public Policy'
    WHEN "industry" = 'Government & Public Sector' THEN 'Law & Public Policy'
    
    -- Communications, Media, Digital & Creative
    WHEN "industry" = 'Media & Entertainment' THEN 'Communications, Media, Digital & Creative'
    
    -- Public Sector (keep Government separate if needed)
    -- WHEN "industry" = 'Government & Public Sector' THEN 'Public Sector'
    
    -- Strategy & Consultancy
    WHEN "industry" = 'Finance, Banking & Insurance' THEN 'Strategy & Consultancy'
    
    -- Not for Profit
    WHEN "industry" = 'Non-Profit & Social Impact' THEN 'Not for Profit'
    
    -- Default mappings for remaining industries that don't fit primary categories
    WHEN "industry" = 'Education & Training' THEN 'Strategy & Consultancy'
    WHEN "industry" = 'Retail, Food & Consumer Goods' THEN 'Strategy & Consultancy'
    WHEN "industry" = 'Transportation & Logistics' THEN 'IT, Engineering, & Computer Science'
    WHEN "industry" = 'Travel & Hospitality' THEN 'Strategy & Consultancy'
    
    -- Fallback for any unmapped values
    ELSE 'Strategy & Consultancy'
END;

-- Verification query to check the results
SELECT "industry", COUNT(*) as project_count 
FROM "project" 
GROUP BY "industry" 
ORDER BY "industry";
