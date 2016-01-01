require 'sqlite3'

index = {}

idx = 0
File.foreach('dict.dat') do |line|
  word_and_writing = line[0..-2].split('/')[0].split('[')
  word = word_and_writing[0].strip
  index[word] = [] if index[word] == nil
  index[word] << idx

  if word_and_writing.size > 1
    writing = word_and_writing[1].split(']')[0].split(' ')[0].strip
    index[writing] = [] if index[writing] == nil
    index[writing] << idx
  end
  idx += line.length
end

File.open('dict.idx', 'w') do |file|
  index.sort_by { |word, idx| word }.each do |word, idx|
    file.write(word)
    idx.each do |i|
      file.write(',' + i.to_s)
    end
    file.write("\n")
  end
end
