-- =====================================================
-- MIGRATION 028: BANK BALANCE TRIGGERS
-- Sceneside L.L.C Financial System
-- Created: December 18, 2025
-- Purpose: Automatic bank account balance tracking with currency conversion
-- =====================================================

-- =====================================================
-- PART A: ADD CURRENT_BALANCE TO BANK_ACCOUNTS
-- =====================================================

-- Add current_balance field if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='bank_accounts' AND column_name='current_balance') THEN
    ALTER TABLE bank_accounts ADD COLUMN current_balance DECIMAL(15,2) DEFAULT 0;
  END IF;
END $$;

COMMENT ON COLUMN bank_accounts.current_balance IS 'Current balance in account currency (auto-updated by triggers)';

-- =====================================================
-- PART B: FUNCTION TO UPDATE BANK ACCOUNT BALANCE
-- =====================================================

CREATE OR REPLACE FUNCTION update_bank_account_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_account_id UUID;
  v_amount DECIMAL(15,2);
  v_old_amount DECIMAL(15,2);
BEGIN
  -- Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    v_account_id := NEW.bank_account_id;
    v_amount := NEW.amount;
    
    -- Update bank account balance
    UPDATE bank_accounts
    SET current_balance = current_balance + v_amount
    WHERE id = v_account_id;
    
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE
  IF (TG_OP = 'UPDATE') THEN
    -- If account changed or amount changed
    IF (OLD.bank_account_id != NEW.bank_account_id OR OLD.amount != NEW.amount) THEN
      -- Reverse old amount from old account
      UPDATE bank_accounts
      SET current_balance = current_balance - OLD.amount
      WHERE id = OLD.bank_account_id;
      
      -- Add new amount to new account
      UPDATE bank_accounts
      SET current_balance = current_balance + NEW.amount
      WHERE id = NEW.bank_account_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF (TG_OP = 'DELETE') THEN
    v_account_id := OLD.bank_account_id;
    v_old_amount := OLD.amount;
    
    -- Reverse the transaction amount
    UPDATE bank_accounts
    SET current_balance = current_balance - v_old_amount
    WHERE id = v_account_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_bank_account_balance() IS 'Automatically updates bank account balance when transactions are added/modified/deleted';

-- =====================================================
-- PART C: CREATE TRIGGER
-- =====================================================

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trg_update_bank_balance ON bank_transactions;

-- Create trigger
CREATE TRIGGER trg_update_bank_balance
  AFTER INSERT OR UPDATE OR DELETE ON bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_account_balance();

COMMENT ON TRIGGER trg_update_bank_balance ON bank_transactions IS 'Maintains accurate current_balance on bank_accounts';

-- =====================================================
-- PART D: RECALCULATE EXISTING BALANCES
-- =====================================================

-- Reset all balances to 0 first
UPDATE bank_accounts SET current_balance = 0;

-- Recalculate from all existing transactions
DO $$
DECLARE
  v_transaction RECORD;
BEGIN
  -- Process all bank transactions
  FOR v_transaction IN 
    SELECT bank_account_id, amount 
    FROM bank_transactions 
    ORDER BY transaction_date, created_at
  LOOP
    UPDATE bank_accounts
    SET current_balance = current_balance + v_transaction.amount
    WHERE id = v_transaction.bank_account_id;
  END LOOP;
END $$;

-- =====================================================
-- PART G: CREATE VIEW FOR MULTI-CURRENCY BALANCE
-- =====================================================

CREATE OR REPLACE VIEW v_bank_balances_usd AS
SELECT 
  ba.id AS account_id,
  ba.name AS account_name,
  ba.account_type,
  ba.currency AS account_currency,
  ba.current_balance AS balance_in_account_currency,
  
  -- Convert to USD using latest exchange rate
  CASE 
    WHEN ba.currency = 'USD' THEN ba.current_balance
    ELSE ba.current_balance * COALESCE(
      (SELECT rate 
       FROM exchange_rates 
       WHERE from_currency = ba.currency 
         AND to_currency = 'USD' 
       ORDER BY effective_date DESC 
       LIMIT 1),
      1.0
    )
  END AS balance_usd,
  
  ba.is_active,
  ba.is_primary
  
FROM bank_accounts ba
WHERE ba.is_active = true;

COMMENT ON VIEW v_bank_balances_usd IS 'Bank account balances with USD conversion for reporting';

-- Grant access
GRANT SELECT ON v_bank_balances_usd TO authenticated;

-- =====================================================
-- PART F: FUNCTION TO GET TOTAL CASH BALANCE IN USD
-- =====================================================

CREATE OR REPLACE FUNCTION get_total_cash_balance_usd()
RETURNS DECIMAL(15,2) AS $$
DECLARE
  v_total DECIMAL(15,2);
BEGIN
  SELECT COALESCE(SUM(balance_usd), 0)
  INTO v_total
  FROM v_bank_balances_usd;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_total_cash_balance_usd() IS 'Returns total cash balance across all accounts in USD';

-- =====================================================
-- END MIGRATION 028
-- =====================================================
