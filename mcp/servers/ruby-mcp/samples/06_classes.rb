# Classes: state, behaviour, inheritance, and Comparable.

class Account
  include Comparable

  attr_reader :owner, :balance

  def initialize(owner, balance = 0)
    @owner = owner
    @balance = balance
  end

  def deposit(amount)
    raise ArgumentError, "amount must be positive" unless amount.positive?

    @balance += amount
    self
  end

  def <=>(other)
    balance <=> other.balance
  end

  def to_s
    "#{owner}: #{format("%.2f", balance)}"
  end

  def self.open(owner)
    new(owner, 100)
  end
end

class SavingsAccount < Account
  def initialize(owner, balance = 0, rate = 0.05)
    super(owner, balance)
    @rate = rate
  end

  def add_interest
    deposit(balance * @rate)
  end

  def to_s
    "#{super} (savings)"
  end
end

a = Account.new("ada").deposit(50)
b = Account.open("grace")
puts "1. chained deposit: #{a}"
puts "2. class method factory: #{b}"
puts "3. comparison: a < b is #{a < b}, a == b is #{a == b}"
puts "4. sorting: #{[b, a].sort.map(&:owner).inspect}"
puts "5. subclass: #{SavingsAccount.new("alan", 200).add_interest}"

puts "6. is_a?: #{a.is_a?(Account)}, #{a.instance_of?(Account)}"
puts "7. class hierarchy: #{SavingsAccount.ancestors.first(3).inspect}"
puts "8. respond_to?: #{a.respond_to?(:deposit)}, #{a.respond_to?(:withdraw)}"

begin
  a.deposit(-5)
rescue ArgumentError => e
  puts "9. validation error: #{e.message}"
end

puts "10. reflected instance variables: #{a.instance_variables.inspect}"
puts "11. read one with instance_variable_get: #{a.instance_variable_get(:@balance)}"
