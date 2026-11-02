# Raising, rescuing, ensure, retry and custom error classes.

class InsufficientFunds < StandardError
  attr_reader :needed

  def initialize(needed, available)
    super("need #{needed}, have #{available}")
    @needed = needed
  end
end

def withdraw(balance, amount)
  raise InsufficientFunds.new(amount, balance) if amount > balance

  balance - amount
end

attempts = 0
begin
  attempts += 1
  raise "boom" if attempts < 3

  puts "1. succeeded on attempt #{attempts}"
rescue RuntimeError => e
  puts "2. attempt #{attempts} failed: #{e.message}"
  retry if attempts < 3
ensure
  puts "3. ensure runs even after retry (attempts=#{attempts})"
end

begin
  withdraw(10, 50)
rescue InsufficientFunds => e
  puts "4. custom error: #{e.message} (#{e.class}), needed=#{e.needed}"
end

def risky
  yield
rescue ZeroDivisionError => e
  "rescued #{e.class}"
else
  "no error raised"
ensure
  puts "5. ensure inside the method ran"
end
puts "6. with error: #{risky { 1 / 0 }}"
puts "7. without error: #{risky { 1 + 1 }}"

captured = begin
  Integer("nope")
rescue ArgumentError => e
  e
end
puts "8. captured: #{captured.class} - #{captured.message}"
puts "9. $! is nil outside a rescue: #{$!.inspect}"
