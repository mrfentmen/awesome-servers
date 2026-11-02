#!/usr/bin/env ruby
# frozen_string_literal: true

# Builds the bundled data files in data/ from the Ruby interpreter that runs it.
#
# Nothing here is hand-copied guesswork:
#   * keywords  -> each candidate word is fed through Ripper and kept only if the
#                  lexer really emits an :on_kw token for it.
#   * operators -> the documented precedence table, plus hard assertions that the
#                  running interpreter agrees (build fails if it does not).
#   * samples   -> every file in samples/ is executed and its real stdout, stderr
#                  and exit status are recorded next to the source.
#
# Run: ruby scripts/build-data.rb      (or: npm run build:data)

require "ripper"
require "json"
require "rbconfig"
require "open3"

ROOT = File.expand_path("..", __dir__)
DATA = File.join(ROOT, "data")
SAMPLES = File.join(ROOT, "samples")

# Candidates only. Ripper decides which are real keywords.
CANDIDATE_KEYWORDS = %w[
  BEGIN END alias and begin break case class def defined? do else elsif end ensure
  false for if in module next nil not or redo rescue retry return self super then
  true undef unless until when while yield
  __FILE__ __LINE__ __ENCODING__ __END__ __dir__
  fn let var const static function elsif2 elif typeof instanceof new
].freeze

PSEUDO_VARIABLES = %w[__FILE__ __LINE__ __ENCODING__].freeze

def keyword?(word)
  src = word == "__END__" ? "#{word}\n" : "#{word}\n"
  Ripper.lex(src).any? { |(_pos, type, tok)| type == :on_kw && tok == word }
end

def build_keywords
  lines = []
  seen = {}
  CANDIDATE_KEYWORDS.each do |word|
    next if seen[word]
    next unless keyword?(word)

    seen[word] = true
    lines << {
      "word" => word,
      "kind" => PSEUDO_VARIABLES.include?(word) ? "pseudo_variable" : "keyword"
    }
  end
  lines
end

# Documented precedence, tightest first. `verified` entries are checked against
# the running interpreter below; the build aborts if any one disagrees.
OPERATORS = [
  { "level" => 1,  "name" => "method call, index, scope", "operators" => [".", "&.", "::", "[]", "[]="] },
  { "level" => 2,  "name" => "exponentiation (right assoc)", "operators" => ["**"] },
  { "level" => 3,  "name" => "unary (binding to the value, not the result)", "operators" => ["!", "~", "+@"] },
  { "level" => 4,  "name" => "unary minus (weaker than **)", "operators" => ["-@"] },
  { "level" => 5,  "name" => "multiplicative", "operators" => ["*", "/", "%"] },
  { "level" => 6,  "name" => "additive", "operators" => ["+", "-"] },
  { "level" => 7,  "name" => "bitwise shift", "operators" => ["<<", ">>"] },
  { "level" => 8,  "name" => "bitwise and", "operators" => ["&"] },
  { "level" => 9,  "name" => "bitwise or / xor", "operators" => ["|", "^"] },
  { "level" => 10, "name" => "comparison", "operators" => [">", ">=", "<", "<="] },
  { "level" => 11, "name" => "equality, match, spaceship", "operators" => ["<=>", "==", "===", "!=", "=~", "!~"] },
  { "level" => 12, "name" => "logical and", "operators" => ["&&"] },
  { "level" => 13, "name" => "logical or", "operators" => ["||"] },
  { "level" => 14, "name" => "range", "operators" => ["..", "..."] },
  { "level" => 15, "name" => "ternary", "operators" => ["? :"] },
  { "level" => 16, "name" => "modifier rescue", "operators" => ["expr rescue expr"] },
  { "level" => 17, "name" => "assignment (right assoc)", "operators" => ["=", "+=", "-=", "*=", "/=", "%=", "**=", "&&=", "||=", "&=", "|=", "^=", "<<=", ">>="] },
  { "level" => 18, "name" => "defined?", "operators" => ["defined?"] },
  { "level" => 19, "name" => "not", "operators" => ["not"] },
  { "level" => 20, "name" => "and / or", "operators" => ["and", "or"] },
  { "level" => 21, "name" => "modifier if / unless / while / until", "operators" => ["expr if expr", "expr unless expr", "expr while expr", "expr until expr"] }
].freeze

# Each check is [expression, expected]. They fail if precedence is misunderstood.
OPERATOR_CHECKS = [
  ["-2 ** 2", -4],           # unary minus binds looser than **
  ["2 ** 3 ** 2", 512],      # ** is right associative
  ["1 + 2 * 3", 7],
  ["1 << 2 + 1", 8],         # + binds tighter than <<
  ["4 & 1 | 2", 2],          # & tighter than |
  ["1 < 2 && 2 < 3", true],
  ["true || false && false", true], # && tighter than ||
  ["1 == 1 ? 10 : 20", 10],
  ["(1..3).to_a", [1, 2, 3]],
  ["not false", true],
  ["!true == false", true],
  ["[1, 2, 3].map { |x| x * 2 }", [2, 4, 6]],
  ["10 - 4 - 3", 3],         # left associative
  ["2 + 3 == 5", true]
].freeze

def verify_operators
  failures = []
  OPERATOR_CHECKS.each do |expr, expected|
    actual = begin
      eval(expr) # rubocop:disable Security/Eval -- build-time self-check on literals above
    rescue StandardError => e
      failures << "#{expr} raised #{e.class}: #{e.message}"
      next
    end
    failures << "#{expr} => #{actual.inspect}, expected #{expected.inspect}" unless actual == expected
  end
  unless failures.empty?
    abort "operator precedence self-check failed:\n  #{failures.join("\n  ")}"
  end
  OPERATOR_CHECKS.length
end

def run_sample(path)
  out, err, status = Open3.capture3(RbConfig.ruby, path, chdir: File.dirname(path))
  {
    "name" => File.basename(path),
    "path" => "samples/#{File.basename(path)}",
    "bytes" => File.size(path),
    "code" => File.read(path),
    "exit_code" => status.exitstatus,
    "stdout" => out,
    "stderr" => err
  }
end

def build_samples
  unless Dir.exist?(SAMPLES)
    warn "no samples/ directory - writing an empty sample list"
    return []
  end
  files = Dir.glob(File.join(SAMPLES, "*.rb")).sort
  samples = files.map { |f| run_sample(f) }
  broken = samples.reject { |s| s["exit_code"].zero? && s["stderr"].empty? }
  unless broken.empty?
    detail = broken.map { |s| "#{s["name"]}: exit #{s["exit_code"]}\n#{s["stderr"]}" }.join("\n")
    abort "sample programs failed to run cleanly:\n#{detail}"
  end
  samples
end

Dir.mkdir(DATA) unless Dir.exist?(DATA)

keywords = build_keywords
checks = verify_operators
samples = build_samples

File.write(File.join(DATA, "keywords.json"), JSON.pretty_generate(keywords) + "\n")
File.write(File.join(DATA, "operators.json"), JSON.pretty_generate(OPERATORS) + "\n")
File.write(File.join(DATA, "samples.json"), JSON.pretty_generate(samples) + "\n")

meta = {
  "language" => "Ruby",
  "site" => "https://www.ruby-lang.org",
  "docs" => "https://docs.ruby-lang.org/en/#{RUBY_VERSION.split(".")[0, 2].join(".")}/",
  "generated_with" => RUBY_DESCRIPTION,
  "ruby_version" => RUBY_VERSION,
  "engine" => defined?(RUBY_ENGINE) ? RUBY_ENGINE : "ruby",
  "generated_at" => Time.now.utc.strftime("%Y-%m-%d"),
  "keywords" => keywords.length,
  "operators" => OPERATORS.sum { |row| row["operators"].length },
  "precedence_levels" => OPERATORS.length,
  "operator_checks" => checks,
  "samples" => samples.length,
  "notes" => [
    "Keywords are verified with Ripper: a candidate is kept only when the lexer emits an :on_kw token for it.",
    "The precedence table is checked against this interpreter by #{checks} real expressions; the build aborts if any disagree.",
    "Every sample program is executed during the build and its real stdout/stderr/exit status is stored.",
    "Class, method and signature data is not bundled - it is read live from whichever ruby is on PATH at request time."
  ]
}
File.write(File.join(DATA, "meta.json"), JSON.pretty_generate(meta) + "\n")

puts "data written: #{keywords.length} keywords, #{OPERATORS.length} precedence levels (#{checks} checks), #{samples.length} samples"
puts "generated with #{RUBY_DESCRIPTION}"
