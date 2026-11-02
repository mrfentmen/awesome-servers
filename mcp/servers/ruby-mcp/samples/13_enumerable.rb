# A class that includes Enumerable gets dozens of methods from one #each.

class NumberBox
  include Enumerable

  def initialize(*numbers)
    @numbers = numbers
  end

  def each
    return enum_for(:each) unless block_given?

    @numbers.each { |n| yield n }
    self
  end
end

box = NumberBox.new(4, 1, 3, 2)
puts "1. to_a: #{box.to_a.inspect}"
puts "2. map: #{box.map { |n| n * n }.inspect}"
puts "3. select: #{box.select(&:even?).inspect}"
puts "4. sort: #{box.sort.inspect}"
puts "5. min/max/sum: #{box.min}/#{box.max}/#{box.sum}"
puts "6. include?: #{box.include?(3)}"
puts "7. first(2): #{box.first(2).inspect}"
puts "8. each_with_index: #{box.each_with_index.map { |n, i| "#{i}:#{n}" }.inspect}"
puts "9. group_by parity: #{box.group_by(&:odd?).transform_values(&:size).inspect}"
puts "10. inject: #{box.inject(:+)}"
puts "11. chained: #{box.sort.reverse.first(2).inspect}"
puts "12. lazy enumerator: #{box.lazy.class}"
puts "13. min_by: #{box.min_by { |n| -n }}"
puts "14. partition sizes: #{box.partition(&:even?).map(&:size).inspect}"
puts "15. each without a block returns an Enumerator: #{box.each.class}"
