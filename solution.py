import random
import math


class GeneticTSPSolver:
    def __init__(self, cities, population_size=100, elite_size=20, mutation_rate=0.01, generations=500):
        self.cities = cities  # List of (x, y) coordinates
        self.num_cities = len(cities)
        self.population_size = population_size
        self.elite_size = elite_size
        self.mutation_rate = mutation_rate
        self.generations = generations
        self.distance_matrix = self._calculate_distance_matrix()

    def _calculate_distance_matrix(self):
        """Precomputes distances between all cities for efficiency."""
        matrix = [[0.0] * self.num_cities for _ in range(self.num_cities)]
        for i in range(self.num_cities):
            for j in range(self.num_cities):
                if i != j:
                    x1, y1 = self.cities[i]
                    x2, y2 = self.cities[j]
                    matrix[i][j] = math.sqrt((x1 - x2)**2 + (y1 - y2)**2)
        return matrix

    def _route_distance(self, route):
        """Calculates the total distance of a specific route."""
        path_distance = 0.0
        for i in range(len(route)):
            from_city = route[i]
            to_city = route[(i + 1) % len(route)]
            path_distance += self.distance_matrix[from_city][to_city]
        return path_distance

    def _fitness(self, route):
        """Fitness is the inverse of the route distance."""
        return 1.0 / float(self._route_distance(route))

    def _create_initial_population(self):
        """Generates random valid routes."""
        population = []
        base_route = list(range(self.num_cities))
        for _ in range(self.population_size):
            route = base_route.copy()
            random.shuffle(route)
            population.append(route)
        return population

    def _rank_routes(self, population):
        """Ranks routes based on fitness (descending order)."""
        fitness_results = {}
        for i, route in enumerate(population):
            fitness_results[i] = self._fitness(route)
        return sorted(fitness_results.items(), key=lambda x: x[1], reverse=True)

    def _selection(self, ranked_pop, elite_size):
        """Selects parents using roulette wheel selection, preserving elites."""
        selection_results = []
        # Carry over elites directly
        for i in range(elite_size):
            selection_results.append(ranked_pop[i][0])
        
        # Roulette wheel selection for the rest
        total_fitness = sum([x[1] for x in ranked_pop])
        for _ in range(len(ranked_pop) - elite_size):
            pick = random.uniform(0, total_fitness)
            current = 0
            for i in range(len(ranked_pop)):
                current += ranked_pop[i][1]
                if pick <= current:
                    selection_results.append(ranked_pop[i][0])
                    break
        return selection_results

    def _mating_pool(self, population, selection_results):
        """Extracts the actual routes chosen for mating."""
        pool = []
        for index in selection_results:
            pool.append(population[index])
        return pool

    def _crossover_ordered(self, parent1, parent2):
        """Ordered Crossover (OX) to prevent duplicate cities."""
        child = [-1] * self.num_cities
        
        gene_a = int(random.random() * self.num_cities)
        gene_b = int(random.random() * self.num_cities)
        
        start_gene = min(gene_a, gene_b)
        end_gene = max(gene_a, gene_b)

        # Copy segment from parent1
        for i in range(start_gene, end_gene):
            child[i] = parent1[i]
            
        # Fill remaining slots with parent2 genes in order
        p2_index = 0
        for i in range(self.num_cities):
            if child[i] == -1:
                while parent2[p2_index] in child:
                    p2_index += 1
                child[i] = parent2[p2_index]
        return child

    def _breed_population(self, mating_pool, elite_size):
        """Breeds the next generation."""
        children = []
        length = len(mating_pool) - elite_size
        pool = random.sample(mating_pool, len(mating_pool))

        # Keep elites
        for i in range(elite_size):
            children.append(mating_pool[i])
        
        # Breed remaining population
        for i in range(length):
            child = self._crossover_ordered(pool[i], pool[len(mating_pool) - i - 1])
            children.append(child)
        return children

    def _mutate(self, individual):
        """Inversion mutation: reverses a random subset of the route."""
        if random.random() < self.mutation_rate:
            idx1, idx2 = random.sample(range(self.num_cities), 2)
            start = min(idx1, idx2)
            end = max(idx1, idx2)
            individual[start:end] = list(reversed(individual[start:end]))
        return individual

    def _mutate_population(self, population, elite_size):
        """Applies mutation to the population, excluding elites."""
        mutated_pop = []
        for i in range(len(population)):
            if i < elite_size:
                mutated_pop.append(population[i])  # Protect elites
            else:
                mutated_pop.append(self._mutate(population[i]))
        return mutated_pop

    def solve(self):
        """Executes the genetic algorithm loop."""
        population = self._create_initial_population()
        progress = []
        
        initial_ranked = self._rank_routes(population)
        best_initial_dist = 1 / initial_ranked[0][1]
        print(f"Initial Best Distance: {best_initial_dist:.2f}")
        
        for gen in range(self.generations):
            ranked_pop = self._rank_routes(population)
            progress.append(1 / ranked_pop[0][1])
            
            selection_results = self._selection(ranked_pop, self.elite_size)
            pool = self._mating_pool(population, selection_results)
            children = self._breed_population(pool, self.elite_size)
            population = self._mutate_population(children, self.elite_size)
            
            if (gen + 1) % 100 == 0 or gen == 0:
                print(f"Generation {gen + 1}/{self.generations} | Best Distance: {progress[-1]:.2f}")

        best_route_index = self._rank_routes(population)[0][0]
        best_route = population[best_route_index]
        final_distance = self._route_distance(best_route)
        
        return best_route, final_distance, progress


# --- Execution Example ---
if __name__ == "__main__":
    # Generate 30 random cities in a 200x200 grid
    random.seed(42)
    num_cities = 30
    city_coordinates = [(random.randint(0, 200), random.randint(0, 200)) for _ in range(num_cities)]

    # Initialize and run solver
    solver = GeneticTSPSolver(
        cities=city_coordinates,
        population_size=150,
        elite_size=30,
        mutation_rate=0.02,
        generations=600
    )
    
    best_path, best_dist, history = solver.solve()
    print(f"\\nOptimal Route Found: {best_path}")
    print(f"Optimal Distance: {best_dist:.2f}")

    # print("Convergence plot saved to tsp_convergence.png")
