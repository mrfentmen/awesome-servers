# Reflection and metaprogramming: method_missing, define_method, Struct, send.

class Config
  def initialize
    @values = {}
  end

  def define(key, &block)
    @values[key] = block
    self
  end

  def method_missing(name, *args)
    return @values[name].call if @values.key?(name)

    super
  end

  def respond_to_missing?(name, include_private = false)
    @values.key?(name) || super
  end
end

cfg = Config.new
cfg.define(:host) { "localhost" }.define(:port) { 8080 }
puts "1. method_missing dispatch: #{cfg.host}:#{cfg.port}"
puts "2. respond_to_missing?: #{cfg.respond_to?(:host)} / #{cfg.respond_to?(:nope)}"

begin
  cfg.nope
rescue NoMethodError => e
  puts "3. unknown key raises: #{e.class}"
end

Point = Struct.new(:x, :y) do
  def sum
    x + y
  end
end
point = Point.new(1, 2)
puts "4. Struct: #{point.inspect} sum=#{point.sum} members=#{Point.members.inspect}"
puts "5. Struct destructuring: #{begin; x, y = point; [x, y].inspect; end}"

class Builder
  [:red, :green].each do |color|
    define_method("#{color}?") { @color == color }
  end

  def initialize(color)
    @color = color
  end
end

subject = Builder.new(:green)
puts "6. define_method from data: red?=#{subject.red?} green?=#{subject.green?}"

obj = Object.new
def obj.special
  "singleton method"
end
puts "7. singleton method: #{obj.special}"
puts "8. singleton_class own methods: #{obj.singleton_class.instance_methods(false).inspect}"

puts "9. instance_variable_get: #{subject.instance_variable_get(:@color).inspect}"
puts "10. send: #{subject.send(:green?)}"
puts "11. own instance methods: #{Builder.instance_methods(false).sort.inspect}"
