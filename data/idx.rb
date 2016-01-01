require 'sqlite3'

index = {}

File.open('log_idx.tmp', 'w') do |log|
  # count = 0
  idx = 0
  File.foreach('dict.dat') do |line|
    # count += 1
    begin
      word_and_writing = line.gsub(/\s+/, '').split('/')[0].split('[')
      word = word_and_writing[0]
      index[word] = [] if index[word] == nil
      index[word] << idx
      # log.write(line + ' ' + idx)
      # log.write(word + ' ' + idx.to_s + "\n")

      if word_and_writing.size > 1
        writing = word_and_writing[1].split(']')[0].split('」')[0].gsub('∴「', '')
        index[writing] = [] if index[writing] == nil
        index[writing] << idx
      end
      idx += line.length
      # p count.to_s + ' ' + word
    rescue Exception => e
      # log.write('ERROR: ' + count.to_s + ' ' + word + ' ' + e.message + "\n")
    end
  end
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
