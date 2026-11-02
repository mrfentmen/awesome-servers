# Modules: mixins, module_function, extend, namespacing, hooks.

module Greeting
  def greet
    "hello from #{self.class}"
  end
end

module Countable
  def self.included(base)
    base.extend(ClassMethods)
  end

  module ClassMethods
    def instances_seen
      @instances_seen ||= 0
    end

    def count_instance
      @instances_seen = instances_seen + 1
    end
  end

  def initialize(*)
    super
    self.class.count_instance
  end
end

module Helpers
  module_function

  def double(n)
    n * 2
  end
end

class Widget
  include Greeting
  include Countable
end

class Gadget
  include Countable
end

Widget.new
Widget.new
Gadget.new

puts "1. mixin method: #{Widget.new.greet}"
puts "2. included hook counted widgets: #{Widget.instances_seen}"
puts "3. and gadgets separately: #{Gadget.instances_seen}"
puts "4. module_function callable on the module: #{Helpers.double(21)}"

module Shoutable
  def shout
    "#{self.class.name.upcase}!"
  end
end

obj = Object.new
obj.extend(Shoutable)
puts "5. extend adds singleton methods: #{obj.shout} (own: #{obj.singleton_methods.inspect})"

module Shop
  class Order
    def to_s
      "Shop::Order"
    end
  end
end
puts "6. namespacing: #{Shop::Order.new}, resolved constant: #{Shop.const_get(:Order)}"

puts "7. included_modules: #{Widget.included_modules.include?(Greeting)}"
puts "8. ancestors order: #{Widget.ancestors.first(4).inspect}"
